use keyring::Entry;

pub fn get_api_key(service: &str) -> Option<String> {
    let entry = Entry::new("nasus-search", service).ok()?;
    entry.get_password().ok()
}

pub fn set_api_key(service: &str, key: &str) -> Result<(), String> {
    let entry = Entry::new("nasus-search", service).map_err(|e| e.to_string())?;
    entry.set_password(key).map_err(|e| e.to_string())
}

pub fn delete_api_key(service: &str) -> Result<(), String> {
    let entry = Entry::new("nasus-search", service).map_err(|e| e.to_string())?;
    // In keyring 3.x, use delete_credential()
    entry.delete_credential().map_err(|e: keyring::Error| e.to_string())
}
