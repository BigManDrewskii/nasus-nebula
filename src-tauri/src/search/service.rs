use crate::search::cache::SearchCache;
use crate::search::pipeline::merge_and_rank;
use crate::search::{SearchError, SearchOptions, SearchProvider, SearchResult};
use std::path::PathBuf;
use std::sync::Arc;

pub struct SearchService {
    cache: Option<Arc<SearchCache>>,
}

impl SearchService {
    pub fn new(cache_path: Option<PathBuf>) -> Self {
        let cache = cache_path.and_then(|path| SearchCache::new(path).ok().map(Arc::new));

        Self { cache }
    }

    pub async fn search(
        &self,
        query: &str,
        num_results: usize,
        providers: Vec<Box<dyn SearchProvider>>,
    ) -> Result<Vec<SearchResult>, SearchError> {
        // 1. Check persistent cache
        if let Some(cache) = &self.cache {
            if let Ok(Some(cached_results)) = cache.get(query, 3600) {
                return Ok(cached_results);
            }
        }

        if providers.is_empty() {
            return Err(SearchError::Config(
                "No search providers configured".to_string(),
            ));
        }

        // 2. Parallel search across providers
        let options = SearchOptions { num_results };
        let mut tasks = Vec::new();

        for provider in &providers {
            tasks.push(provider.search(query, &options));
        }

        let results_list = futures_util::future::join_all(tasks).await;

        let mut valid_provider_results = Vec::new();
        for results in results_list.into_iter().flatten() {
            if !results.is_empty() {
                valid_provider_results.push(results);
            }
        }

        if valid_provider_results.is_empty() {
            return Err(SearchError::Api(
                "All search providers failed or returned no results".to_string(),
            ));
        }

        // 3. Pipeline: Dedup + Rank (RRF)
        let ranked_results = merge_and_rank(valid_provider_results, 60);
        let final_results = ranked_results
            .into_iter()
            .take(num_results)
            .collect::<Vec<_>>();

        // 4. Save to cache
        if let Some(cache) = &self.cache {
            let _ = cache.set(query, &final_results);
        }

        Ok(final_results)
    }
}
