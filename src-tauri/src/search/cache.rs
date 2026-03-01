use rusqlite::{params, Connection};
use crate::search::SearchResult;
use std::path::PathBuf;

pub struct SearchCache {
    db_path: PathBuf,
}

impl SearchCache {
    pub fn new(db_path: PathBuf) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(&db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS search_cache (
                query TEXT PRIMARY KEY,
                results_json TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        Ok(Self { db_path })
    }

    pub fn get(&self, query: &str, ttl_secs: i64) -> Result<Option<Vec<SearchResult>>, String> {
        let conn = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT results_json, timestamp FROM search_cache WHERE query = ? AND (strftime('%s', 'now') - strftime('%s', timestamp)) < ?")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt.query(params![query, ttl_secs]).map_err(|e| e.to_string())?;

        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let json: String = row.get(0).map_err(|e| e.to_string())?;
            let results: Vec<SearchResult> = serde_json::from_str(&json).map_err(|e| e.to_string())?;
            return Ok(Some(results));
        }

        Ok(None)
    }

    pub fn set(&self, query: &str, results: &[SearchResult]) -> Result<(), String> {
        let conn = Connection::open(&self.db_path).map_err(|e| e.to_string())?;
        let json = serde_json::to_string(results).map_err(|e| e.to_string())?;
        
        conn.execute(
            "INSERT OR REPLACE INTO search_cache (query, results_json, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)",
            params![query, json],
        ).map_err(|e| e.to_string())?;

        Ok(())
    }
}
