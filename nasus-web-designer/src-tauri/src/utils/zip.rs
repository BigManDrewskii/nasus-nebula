use std::fs::File;
use std::io::Write;
use zip::write::FileOptions;
use anyhow::Result;

pub fn create_project_zip(files: Vec<(String, String)>, output_path: &str) -> Result<()> {
    let zip_file = File::create(output_path)?;
    let mut zip = zip::ZipWriter::new(zip_file);

    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    for (filename, content) in files {
        zip.start_file(&filename, options)?;
        zip.write_all(content.as_bytes())?;
    }

    zip.finish()?;
    Ok(())
}
