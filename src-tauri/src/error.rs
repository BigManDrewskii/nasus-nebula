use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum NasusError {
    #[error("I/O Error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Docker Error: {0}")]
    Docker(#[from] bollard::errors::Error),

    #[error("Configuration Error: {0}")]
    Config(String),

    #[error("Command Execution Error: {0}")]
    Command(String),

    #[error("Sidecar Error: {0}")]
    Sidecar(String),

    #[error("Database Error: {0}")]
    Database(String),

    #[error("Search Error: {0}")]
    Search(String),

    #[error("Internal Error: {0}")]
    Internal(String),
}

/// Manual Serialize impl so NasusError can be returned from #[tauri::command] functions.
/// Tauri requires the error type to be serializable; we serialize as a plain error string.
impl Serialize for NasusError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
