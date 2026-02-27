use std::collections::HashMap;
use crate::search::SearchResult;

/// Reciprocal Rank Fusion (RRF) implementation
/// Scores results using the formula: score = sum(1 / (k + rank))
/// where k is a constant (usually 60) and rank is 1-based position.
pub fn merge_and_rank(provider_results: Vec<Vec<SearchResult>>, k: i32) -> Vec<SearchResult> {
    let mut scores: HashMap<String, (f32, SearchResult)> = HashMap::new();

    for results in provider_results {
        for (rank, res) in results.into_iter().enumerate() {
            let entry = scores.entry(res.url.clone()).or_insert((0.0, res));
            entry.0 += 1.0 / (k as f32 + (rank + 1) as f32);
        }
    }

    let mut final_results: Vec<SearchResult> = scores
        .into_iter()
        .map(|(_, (score, mut res))| {
            res.score = score;
            res
        })
        .collect();

    final_results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    final_results
}

/// Deduplicate results by URL
pub fn deduplicate(results: Vec<SearchResult>) -> Vec<SearchResult> {
    let mut seen = std::collections::HashSet::new();
    results
        .into_iter()
        .filter(|r| seen.insert(r.url.clone()))
        .collect()
}
