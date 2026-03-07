//! Docker container management for code execution sandbox.
//!
//! Simplified implementation using bollard v0.18

use bollard::container::{
    Config, CreateContainerOptions, StartContainerOptions, StopContainerOptions,
};
use bollard::exec::{CreateExecOptions, StartExecOptions, StartExecResults};
use bollard::image::CreateImageOptions;
use bollard::models::HostConfig;
use bollard::Docker;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tokio::time::{timeout, Duration};

/// Result from creating a container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerResult {
    pub container_id: String,
}

/// Result from executing code in a container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i64,
}

/// Configuration for creating a sandbox container
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    pub image: String,
    pub memory: u64,
    pub cpu_shares: u64,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            image: "python:3.12-slim".to_string(),
            memory: 512 * 1024 * 1024, // 512MB
            cpu_shares: 1024,
        }
    }
}

/// Check if Docker is available and running
pub async fn check_docker_status() -> Result<bool, String> {
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

    docker
        .version()
        .await
        .map(|_| true)
        .map_err(|e| format!("Docker not responding: {}", e))
}

/// Create a new sandbox container for code execution
pub async fn create_container(
    task_id: &str,
    workspace_path: &str,
    config: &SandboxConfig,
) -> Result<CreateContainerResponse, String> {
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

    // Ensure the image is available
    ensure_image(&docker, &config.image).await?;

    // workspace_path is the base directory (e.g. /tmp/nasus-workspace).
    // Append task-{id} to match what all other Rust workspace commands do.
    let task_dir = std::path::Path::new(workspace_path).join(format!("task-{}", task_id));

    // Ensure the path is absolute — if workspace_path was empty or relative, fall back to $HOME
    let workspace_full = if task_dir.is_absolute() {
        task_dir
    } else {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
        std::path::PathBuf::from(home)
            .join(".nasus")
            .join("workspaces")
            .join(format!("task-{}", task_id))
    };

    // Create workspace directory if it doesn't exist
    std::fs::create_dir_all(&workspace_full)
        .map_err(|e| format!("Failed to create workspace directory: {}", e))?;

    let workspace_str = workspace_full
        .to_str()
        .ok_or_else(|| "Invalid workspace path".to_string())?;

    // Build HostConfig using bollard's model
    let host_config = HostConfig {
        binds: Some(vec![format!("{}:/workspace:rw", workspace_str)]),
        memory: Some(config.memory as i64),
        cpu_shares: Some(config.cpu_shares as i64),
        network_mode: Some("bridge".to_string()),
        publish_all_ports: Some(false),
        security_opt: Some(vec!["no-new-privileges".to_string()]),
        cap_drop: Some(vec!["ALL".to_string()]),
        ..Default::default()
    };

    // Container configuration
    let container_config = Config {
        image: Some(config.image.clone()),
        tty: Some(false),
        attach_stdin: Some(false),
        attach_stdout: Some(true),
        attach_stderr: Some(true),
        open_stdin: Some(false),
        host_config: Some(host_config),
        working_dir: Some("/workspace".to_string()),
        ..Default::default()
    };

    // Remove any stale container with the same name to avoid name collision
    let container_name = format!("nasus-sandbox-{}", task_id);
    let _ = docker
        .stop_container(&container_name, Some(StopContainerOptions { t: 2 }))
        .await;
    let _ = docker.remove_container(&container_name, None).await;

    let options = Some(CreateContainerOptions {
        name: container_name,
        platform: None,
    });

    let container = docker
        .create_container(options, container_config)
        .await
        .map_err(|e| format!("Failed to create container: {}", e))?;

    let container_id = container.id;

    // Start the container
    docker
        .start_container(&container_id, None::<StartContainerOptions<String>>)
        .await
        .map_err(|e| format!("Failed to start container: {}", e))?;

    Ok(CreateContainerResponse { container_id })
}

/// Execute Python code in a container
pub async fn execute_python(
    container_id: &str,
    code: &str,
    timeout_ms: u64,
) -> Result<ExecResult, String> {
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

    // Create exec instance
    let exec_config = CreateExecOptions {
        cmd: Some(vec!["python3", "-c", code]),
        attach_stdout: Some(true),
        attach_stderr: Some(true),
        working_dir: Some("/workspace"),
        ..Default::default()
    };

    let exec = docker
        .create_exec(container_id, exec_config)
        .await
        .map_err(|e| format!("Failed to create exec: {}", e))?;

    // Start exec with timeout
    let exec_result = timeout(
        Duration::from_millis(timeout_ms),
        docker.start_exec(&exec.id, None::<StartExecOptions>),
    )
    .await
    .map_err(|_| "Execution timed out".to_string())?
    .map_err(|e| format!("Failed to start exec: {}", e))?;

    // Parse output
    let (stdout, stderr) = parse_exec_output(exec_result).await;

    // Inspect exec to get exit code
    let inspect = docker
        .inspect_exec(&exec.id)
        .await
        .map_err(|e| format!("Failed to inspect exec: {}", e))?;

    let exit_code = inspect.exit_code.unwrap_or(-1);

    Ok(ExecResult {
        stdout,
        stderr,
        exit_code,
    })
}

/// Execute a bash command in a container
pub async fn execute_bash(
    container_id: &str,
    command: &str,
    timeout_ms: u64,
) -> Result<ExecResult, String> {
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

    // Create exec instance with sh
    let exec_config = CreateExecOptions {
        cmd: Some(vec!["sh", "-c", command]),
        attach_stdout: Some(true),
        attach_stderr: Some(true),
        working_dir: Some("/workspace"),
        ..Default::default()
    };

    let exec = docker
        .create_exec(container_id, exec_config)
        .await
        .map_err(|e| format!("Failed to create exec: {}", e))?;

    // Start exec with timeout
    let exec_result = timeout(
        Duration::from_millis(timeout_ms),
        docker.start_exec(&exec.id, None::<StartExecOptions>),
    )
    .await
    .map_err(|_| "Execution timed out".to_string())?
    .map_err(|e| format!("Failed to start exec: {}", e))?;

    // Parse output
    let (stdout, stderr) = parse_exec_output(exec_result).await;

    // Inspect exec to get exit code
    let inspect = docker
        .inspect_exec(&exec.id)
        .await
        .map_err(|e| format!("Failed to inspect exec: {}", e))?;

    let exit_code = inspect.exit_code.unwrap_or(-1);

    Ok(ExecResult {
        stdout,
        stderr,
        exit_code,
    })
}

/// Stop and remove a container
pub async fn dispose_container(container_id: &str) -> Result<(), String> {
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Failed to connect to Docker: {}", e))?;

    // Stop container (graceful, then force kill)
    let _ = docker
        .stop_container(
            container_id,
            Some(StopContainerOptions { t: 5 }),
        )
        .await;

    // Remove container
    docker
        .remove_container(container_id, None)
        .await
        .map_err(|e| format!("Failed to remove container: {}", e))?;

    Ok(())
}

// ============================================================================
// Helper functions
// ============================================================================

/// Response from container creation
#[derive(Debug, Clone)]
pub struct CreateContainerResponse {
    pub container_id: String,
}

/// Ensure the Docker image is available, pulling if necessary
async fn ensure_image(docker: &Docker, image: &str) -> Result<(), String> {
    // Check if image exists locally
    let images = docker
        .list_images::<String>(None)
        .await
        .map_err(|e| format!("Failed to list images: {}", e))?;

    let image_exists = images.iter().any(|img| {
        let tags = &img.repo_tags;
        tags.iter().any(|t| t == image)
    });

    if image_exists {
        return Ok(());
    }

    // Local-only images (e.g. nasus-*) can't be pulled from Docker Hub
    if image.starts_with("nasus-") {
        return Err(format!(
            "Image '{}' not found locally. Build it first with: docker build -t {} -f docker/Dockerfile.sandbox docker/",
            image, image
        ));
    }

    // Pull the image - create_image returns a Stream directly
    let mut image_stream = docker.create_image(
        Some(CreateImageOptions {
            from_image: image.to_string(),
            ..Default::default()
        }),
        None,
        None,
    );

    // Wait for pull to complete
    while let Some(result) = image_stream.next().await {
        match result {
            Ok(_) => continue,
            Err(e) => return Err(format!("Failed to download image: {}", e)),
        }
    }

    Ok(())
}

/// Parse exec output into stdout and stderr strings
async fn parse_exec_output(output: StartExecResults) -> (String, String) {
    let mut stdout = String::new();
    let mut stderr = String::new();

    match output {
        StartExecResults::Attached { mut output, .. } => {
            while let Some(result) = output.next().await {
                match result {
                    Ok(bollard::container::LogOutput::StdOut { message }) => {
                        stdout.push_str(&String::from_utf8_lossy(&message));
                    }
                    Ok(bollard::container::LogOutput::StdErr { message }) => {
                        stderr.push_str(&String::from_utf8_lossy(&message));
                    }
                    Err(_) => continue,
                    _ => continue,
                }
            }
        }
        _ => {}
    }

    (stdout, stderr)
}

// ============================================================================
// Tauri command wrappers
// ============================================================================

pub mod commands {
    use super::*;
    use crate::{NasusError, NasusResult};

    /// Create a Docker sandbox container
    #[tauri::command]
    pub async fn docker_create_container(
        task_id: String,
        workspace_path: String,
        image: Option<String>,
        memory: Option<String>,
        cpu: Option<String>,
    ) -> NasusResult<ContainerResult> {
        let config = if memory.is_some() || image.is_some() {
            SandboxConfig {
                image: image.unwrap_or_else(|| "python:3.12-slim".to_string()),
                memory: memory.as_ref()
                    .and_then(|s| parse_memory_limit(s).ok())
                    .unwrap_or(512 * 1024 * 1024),
                cpu_shares: cpu.as_ref()
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(1024),
            }
        } else {
            SandboxConfig::default()
        };

        let response = create_container(&task_id, &workspace_path, &config)
            .await
            .map_err(|e| NasusError::Command(e))?;
        Ok(ContainerResult {
            container_id: response.container_id,
        })
    }

    /// Execute Python code in a container
    #[tauri::command]
    pub async fn docker_execute_python(
        container_id: String,
        code: String,
        timeout: Option<u64>,
    ) -> NasusResult<ExecResult> {
        execute_python(&container_id, &code, timeout.unwrap_or(120000))
            .await
            .map_err(|e| NasusError::Command(e))
    }

    /// Execute a bash command in a container
    #[tauri::command]
    pub async fn docker_execute_bash(
        container_id: String,
        command: String,
        timeout: Option<u64>,
    ) -> NasusResult<ExecResult> {
        execute_bash(&container_id, &command, timeout.unwrap_or(120000))
            .await
            .map_err(|e| NasusError::Command(e))
    }

    /// Stop and remove a container
    #[tauri::command]
    pub async fn docker_dispose_container(container_id: String) -> NasusResult<()> {
        dispose_container(&container_id)
            .await
            .map_err(|e| NasusError::Command(e))
    }

    /// Check Docker availability
    #[tauri::command]
    pub async fn docker_check_status() -> NasusResult<bool> {
        check_docker_status()
            .await
            .map_err(|e| NasusError::Command(e))
    }
}

/// Parse memory limit string (e.g., "512m") to bytes
fn parse_memory_limit(limit: &str) -> Result<u64, String> {
    let lower = limit.to_lowercase();
    let (num_str, suffix) = if lower.ends_with('g') {
        (&lower[..lower.len() - 1], 1024 * 1024 * 1024)
    } else if lower.ends_with('m') {
        (&lower[..lower.len() - 1], 1024 * 1024)
    } else if lower.ends_with('k') {
        (&lower[..lower.len() - 1], 1024)
    } else {
        (lower.as_str(), 1)
    };

    let num: u64 = num_str
        .parse()
        .map_err(|_| format!("Invalid memory limit: {}", limit))?;

    Ok(num.saturating_mul(suffix))
}
