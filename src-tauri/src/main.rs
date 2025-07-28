// CFU - Cordatus Flash Utility - Tauri Backend
// Real USB detection, flashing process management, and container integration
// Developer: İbrahim Çoban

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use log::{debug, error, info, warn};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{command, generate_handler, Builder, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use uuid::Uuid;

// Data structures matching frontend types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JetsonDevice {
    pub id: String,
    pub vendor: String,
    pub product: String,
    pub module: String,
    pub board_id: String,
    pub is_connected: bool,
    pub supported_l4t: Vec<String>,
    pub storage_options: Vec<String>,
    pub usb_info: Option<UsbDeviceInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsbDeviceInfo {
    pub vendor_id: u16,
    pub product_id: u16,
    pub device_path: String,
    pub bus_number: u8,
    pub device_address: u8,
    pub is_recovery_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlashProgress {
    pub stage: String, // 'preparing' | 'downloading' | 'flashing' | 'verifying' | 'complete' | 'error'
    pub progress: f32,
    pub message: String,
    pub details: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub estimated_time_remaining: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlashCommand {
    pub product: String,
    pub device_module: String,
    pub jetpack_version: String,
    pub storage_device: String,
    pub keep_files: bool,
    pub user_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub name: String,
    pub tag: String,
    pub category: String,
    pub description: String,
    pub size: String,
    pub supported_devices: Vec<String>,
    pub is_installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub architecture: String,
    pub total_memory: u64,
    pub available_space: u64,
    pub docker_installed: bool,
    pub nvidia_docker_installed: bool,
    pub jetpack_version: Option<String>,
}

// Application state
#[derive(Debug)]
pub struct AppState {
    pub connected_devices: Arc<Mutex<HashMap<String, JetsonDevice>>>,
    pub flash_progress: Arc<Mutex<HashMap<String, FlashProgress>>>,
    pub active_flashes: Arc<Mutex<HashMap<String, tokio::process::Child>>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            connected_devices: Arc::new(Mutex::new(HashMap::new())),
            flash_progress: Arc::new(Mutex::new(HashMap::new())),
            active_flashes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// Load CSV data from bundled resources
#[command]
async fn load_csv_data(app: tauri::AppHandle) -> Result<String, String> {
    use std::path::PathBuf;
    
    // Try to load from bundled resources first
    if let Ok(resource_path) = app.path().resource_dir() {
        let csv_path = resource_path.join("template.csv");
        if let Ok(content) = std::fs::read_to_string(&csv_path) {
            info!("Loaded CSV data from bundled resources: {} bytes", content.len());
            return Ok(content);
        }
    }
    
    // Fallback to development paths
    let dev_paths = vec![
        PathBuf::from("./data/template.csv"),
        PathBuf::from("../data/template.csv"),
    ];
    
    for dev_path in dev_paths {
        if let Ok(content) = std::fs::read_to_string(&dev_path) {
            info!("Loaded CSV data from development path: {} bytes", content.len());
            return Ok(content);
        }
    }
    
    // If none found, return error
    match std::fs::read_to_string("../data/template.csv") {
        Ok(content) => {
            info!("Loaded CSV data from development path: {} bytes", content.len());
            Ok(content)
        }
        Err(e) => {
            error!("Failed to load CSV data: {}", e);
            Err(format!("Could not load device configuration data: {}", e))
        }
    }
}

// USB Device Detection
#[command]
async fn detect_usb_devices(state: State<'_, Arc<AppState>>) -> Result<Vec<JetsonDevice>, String> {
    info!("Starting USB device detection...");
    
    let mut devices = Vec::new();
    let jetson_vendor_id = 0x0955; // NVIDIA vendor ID
    
    // Known Jetson device product IDs
    let jetson_products = vec![
        (0x7c18, "AGX Orin", "AGX Orin"),
        (0x7e19, "Orin NX", "Orin NX"), 
        (0x7f21, "Orin Nano", "Orin Nano"),
        (0x7019, "AGX Xavier", "AGX Xavier"),
        (0x7e19, "Xavier NX", "Xavier NX"),
        (0x7f21, "Nano", "Nano - 4GB"),
    ];
    
    match rusb::devices() {
        Ok(device_list) => {
            for device in device_list.iter() {
                if let Ok(device_desc) = device.device_descriptor() {
                    if device_desc.vendor_id() == jetson_vendor_id {
                        // Found a potential Jetson device
                        if let Some((_, product, module)) = jetson_products.iter()
                            .find(|(pid, _, _)| *pid == device_desc.product_id()) {
                            
                            let bus_number = device.bus_number();
                            let device_address = device.address();
                            let device_path = format!("/dev/bus/usb/{:03}/{:03}", bus_number, device_address);
                            
                            // Check if device is in recovery mode
                            let is_recovery_mode = check_recovery_mode(&device).unwrap_or(false);
                            
                            let usb_info = UsbDeviceInfo {
                                vendor_id: device_desc.vendor_id(),
                                product_id: device_desc.product_id(),
                                device_path: device_path.clone(),
                                bus_number,
                                device_address,
                                is_recovery_mode,
                            };
                            
                            let jetson_device = JetsonDevice {
                                id: format!("jetson-{:04x}-{:03}-{:03}", device_desc.product_id(), bus_number, device_address),
                                vendor: "NVIDIA".to_string(),
                                product: product.to_string(),
                                module: module.to_string(),
                                board_id: get_board_id_from_module(module),
                                is_connected: true,
                                supported_l4t: get_supported_l4t_versions(module),
                                storage_options: get_storage_options(module),
                                usb_info: Some(usb_info),
                            };
                            
                            devices.push(jetson_device);
                            info!("Found Jetson device: {} {} (Recovery: {})", product, module, is_recovery_mode);
                        }
                    }
                }
            }
        }
        Err(e) => {
            error!("Failed to enumerate USB devices: {}", e);
            return Err(format!("USB enumeration failed: {}", e));
        }
    }
    
    // Update state
    {
        let mut connected_devices = state.connected_devices.lock().unwrap();
        connected_devices.clear();
        for device in &devices {
            connected_devices.insert(device.id.clone(), device.clone());
        }
    }
    
    info!("Found {} Jetson devices", devices.len());
    Ok(devices)
}

// Check if device is in recovery mode
fn check_recovery_mode(device: &rusb::Device<rusb::GlobalContext>) -> Result<bool> {
    // In recovery mode, Jetson devices typically have specific interface configurations
    // This is a simplified check - more sophisticated detection could be implemented
    if let Ok(config_desc) = device.active_config_descriptor() {
        // Recovery mode devices typically have a single interface with specific characteristics
        if config_desc.num_interfaces() == 1 {
            if let Some(interface) = config_desc.interfaces().next() {
                if let Some(interface_desc) = interface.descriptors().next() {
                    // Check for recovery mode interface characteristics
                    return Ok(interface_desc.class_code() == 0xFF && 
                             interface_desc.sub_class_code() == 0x00);
                }
            }
        }
    }
    Ok(false)
}

// Get board ID mapping for modules
fn get_board_id_from_module(module: &str) -> String {
    match module {
        "AGX Orin" => "3701-0000".to_string(),
        "Orin NX" => "3767-0000".to_string(),
        "Orin Nano" => "3767-0003".to_string(),
        "AGX Xavier" => "2888-0001".to_string(),
        "Xavier NX" => "3668-0000".to_string(),
        "Nano - 4GB" => "3448-0002".to_string(),
        _ => "0000-0000".to_string(),
    }
}

// Get supported L4T versions for modules
fn get_supported_l4t_versions(module: &str) -> Vec<String> {
    match module {
        "AGX Orin" | "Orin NX" | "Orin Nano" => vec![
            "36.4.4".to_string(), "36.4.3".to_string(), "36.4.0".to_string(),
            "36.3.0".to_string(), "36.2.0".to_string(), "35.5.0".to_string(),
            "35.4.1".to_string(), "35.3.1".to_string(), "35.2.1".to_string(),
        ],
        "AGX Xavier" | "Xavier NX" => vec![
            "35.5.0".to_string(), "35.4.1".to_string(), "35.3.1".to_string(),
            "35.2.1".to_string(), "32.7.5".to_string(), "32.7.4".to_string(),
            "32.7.3".to_string(), "32.7.2".to_string(), "32.7.1".to_string(),
        ],
        "Nano - 4GB" => vec![
            "32.7.5".to_string(), "32.7.4".to_string(), "32.7.3".to_string(),
            "32.7.2".to_string(), "32.7.1".to_string(),
        ],
        _ => vec![],
    }
}

// Get storage options for modules
fn get_storage_options(module: &str) -> Vec<String> {
    match module {
        "AGX Orin" | "Orin NX" | "AGX Xavier" | "Xavier NX" => vec![
            "nvme".to_string(), "sd".to_string(), "emmc".to_string(),
        ],
        "Orin Nano" => vec![
            "nvme".to_string(), "sd".to_string(),
        ],
        "Nano - 4GB" => vec![
            "sd".to_string(),
        ],
        _ => vec!["sd".to_string()],
    }
}

// Real flashing process
#[command]
async fn start_flash_process(
    command: FlashCommand,
    state: State<'_, Arc<AppState>>,
    window: tauri::Window,
) -> Result<String, String> {
    let flash_id = Uuid::new_v4().to_string();
    info!("Starting flash process with ID: {}", flash_id);
    
    // Initialize progress
    let progress = FlashProgress {
        stage: "preparing".to_string(),
        progress: 0.0,
        message: "Preparing flash process...".to_string(),
        details: None,
        start_time: Some(Utc::now()),
        estimated_time_remaining: None,
    };
    
    {
        let mut flash_progress = state.flash_progress.lock().unwrap();
        flash_progress.insert(flash_id.clone(), progress);
    }
    
    // Emit initial progress
    window.emit("flash-progress", &flash_id).map_err(|e| e.to_string())?;
    
    // Spawn the actual flashing process
    let flash_id_clone = flash_id.clone();
    let state_clone = Arc::clone(tauri::State::inner(&state));
    let state_clone_error = Arc::clone(&state_clone);
    let window_clone = window.clone();
    
    tokio::spawn(async move {
        match execute_flash_process(command, flash_id_clone.clone(), state_clone, window_clone).await {
            Ok(_) => {
                info!("Flash process completed successfully: {}", flash_id_clone);
            }
            Err(e) => {
                error!("Flash process failed: {} - {}", flash_id_clone, e);
                
                // Update progress with error
                let error_progress = FlashProgress {
                    stage: "error".to_string(),
                    progress: 0.0,
                    message: "Flash process failed".to_string(),
                    details: Some(e.to_string()),
                    start_time: None,
                    estimated_time_remaining: None,
                };
                
                if let Ok(mut flash_progress) = state_clone_error.flash_progress.lock() {
                    flash_progress.insert(flash_id_clone.clone(), error_progress);
                }
            }
        }
    });
    
    Ok(flash_id)
}

// Execute the actual flashing process
async fn execute_flash_process(
    command: FlashCommand,
    flash_id: String,
    state: Arc<AppState>,
    window: tauri::Window,
) -> Result<()> {
    // Update progress: downloading
    update_flash_progress(&state, &window, &flash_id, FlashProgress {
        stage: "downloading".to_string(),
        progress: 10.0,
        message: "Downloading JetPack files...".to_string(),
        details: Some(format!("Downloading {} for {}", command.jetpack_version, command.device_module)),
        start_time: None,
        estimated_time_remaining: Some(300), // 5 minutes estimated
    }).await?;
    
    // Prepare flash command with proper paths
    let script_path = get_script_path().await.map_err(|e| anyhow::anyhow!(e))?;
    let working_dir = get_working_directory().await.map_err(|e| anyhow::anyhow!(e))?;
    
    let mut cmd = TokioCommand::new("bash");
    cmd.arg(&script_path)
       .arg(&command.product)
       .arg(&command.device_module)
       .arg(&command.jetpack_version)
       .arg(&command.storage_device)
       .arg(if command.keep_files { "true" } else { "false" })
       .arg(&command.user_name)
       .current_dir(&working_dir)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    info!("Executing flash command: {:?}", cmd);
    
    let mut child = cmd.spawn().context("Failed to start flash process")?;
    
    // Take stdout before storing the child
    let stdout = child.stdout.take();
    
    // Store the child process
    {
        let mut active_flashes = state.active_flashes.lock().unwrap();
        active_flashes.insert(flash_id.clone(), child);
    }
    
    // Read stdout and stderr for progress updates
    if let Some(stdout) = stdout {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        
        while let Ok(Some(line)) = lines.next_line().await {
            debug!("Flash output: {}", line);
            
            // Parse progress from output
            if let Some(progress_info) = parse_flash_output(&line) {
                update_flash_progress(&state, &window, &flash_id, progress_info).await?;
            }
        }
    }
    
    // Retrieve and wait for process completion
    let mut child = {
        let mut active_flashes = state.active_flashes.lock().unwrap();
        active_flashes.remove(&flash_id).context("Flash process not found")?
    };
    
    let output = child.wait().await.context("Flash process failed")?;
    
    if output.success() {
        // Update progress: complete
        update_flash_progress(&state, &window, &flash_id, FlashProgress {
            stage: "complete".to_string(),
            progress: 100.0,
            message: "Flash process completed successfully!".to_string(),
            details: Some("Device is ready to use".to_string()),
            start_time: None,
            estimated_time_remaining: None,
        }).await?;
    } else {
        return Err(anyhow::anyhow!("Flash process exited with error code: {}", output.code().unwrap_or(-1)));
    }
    
    // Clean up
    {
        let mut active_flashes = state.active_flashes.lock().unwrap();
        active_flashes.remove(&flash_id);
    }
    
    Ok(())
}

// Parse flash output for progress information
fn parse_flash_output(line: &str) -> Option<FlashProgress> {
    // Define regex patterns for different stages
    let download_regex = Regex::new(r"Downloading.*?(\d+)%").ok()?;
    let flash_regex = Regex::new(r"Flashing.*?(\d+)%").ok()?;
    let verify_regex = Regex::new(r"Verifying.*?(\d+)%").ok()?;
    
    if let Some(caps) = download_regex.captures(line) {
        if let Ok(progress) = caps[1].parse::<f32>() {
            return Some(FlashProgress {
                stage: "downloading".to_string(),
                progress: progress * 0.3, // Downloading is 0-30%
                message: line.to_string(),
                details: None,
                start_time: None,
                estimated_time_remaining: Some(((100.0 - progress) * 2.0) as u64), // Rough estimate
            });
        }
    }
    
    if let Some(caps) = flash_regex.captures(line) {
        if let Ok(progress) = caps[1].parse::<f32>() {
            return Some(FlashProgress {
                stage: "flashing".to_string(),
                progress: 30.0 + (progress * 0.6), // Flashing is 30-90%
                message: line.to_string(),
                details: None,
                start_time: None,
                estimated_time_remaining: Some(((100.0 - progress) * 1.5) as u64),
            });
        }
    }
    
    if let Some(caps) = verify_regex.captures(line) {
        if let Ok(progress) = caps[1].parse::<f32>() {
            return Some(FlashProgress {
                stage: "verifying".to_string(),
                progress: 90.0 + (progress * 0.1), // Verifying is 90-100%
                message: line.to_string(),
                details: None,
                start_time: None,
                estimated_time_remaining: Some(((100.0 - progress) * 0.5) as u64),
            });
        }
    }
    
    None
}

// Update flash progress and emit to frontend
async fn update_flash_progress(
    state: &Arc<AppState>,
    window: &tauri::Window,
    flash_id: &str,
    progress: FlashProgress,
) -> Result<()> {
    {
        let mut flash_progress = state.flash_progress.lock().unwrap();
        flash_progress.insert(flash_id.to_string(), progress.clone());
    }
    
    // Emit progress update to frontend
    window.emit("flash-progress-update", serde_json::json!({
        "flash_id": flash_id,
        "progress": progress
    })).context("Failed to emit progress update")?;
    
    Ok(())
}

// Get flash progress
#[command]
async fn get_flash_progress(flash_id: String, state: State<'_, Arc<AppState>>) -> Result<Option<FlashProgress>, String> {
    let flash_progress = state.flash_progress.lock().unwrap();
    Ok(flash_progress.get(&flash_id).cloned())
}

// Cancel flash process
#[command]
async fn cancel_flash_process(flash_id: String, state: State<'_, Arc<AppState>>) -> Result<(), String> {
    info!("Cancelling flash process: {}", flash_id);
    
    let mut child = {
        let mut active_flashes = state.active_flashes.lock().unwrap();
        active_flashes.remove(&flash_id)
    };
    
    if let Some(ref mut child) = child {
        if let Err(e) = child.kill().await {
            warn!("Failed to kill flash process {}: {}", flash_id, e);
        }
    }
    
    // Update progress to cancelled
    let mut flash_progress = state.flash_progress.lock().unwrap();
    flash_progress.remove(&flash_id);
    
    Ok(())
}

// Get system information
#[command]
async fn get_system_info() -> Result<SystemInfo, String> {
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    let memory_info = sys_info::mem_info().map_err(|e| e.to_string())?;
    let disk_info = sys_info::disk_info().map_err(|e| e.to_string())?;
    
    // Check Docker installation
    let docker_installed = Command::new("docker").arg("--version").output().is_ok();
    let nvidia_docker_installed = Command::new("nvidia-container-cli").arg("--version").output().is_ok();
    
    // Try to detect JetPack version
    let jetpack_version = detect_jetpack_version().await;
    
    Ok(SystemInfo {
        os,
        architecture: arch,
        total_memory: memory_info.total * 1024, // Convert to bytes
        available_space: disk_info.free,
        docker_installed,
        nvidia_docker_installed,
        jetpack_version,
    })
}

// Detect JetPack version
async fn detect_jetpack_version() -> Option<String> {
    // Try to read L4T version
    if let Ok(contents) = tokio::fs::read_to_string("/etc/nv_tegra_release").await {
        if let Some(line) = contents.lines().find(|line| line.contains("R")) {
            // Parse version like "# R36 , REVISION: 4.3"
            let version_regex = Regex::new(r"R(\d+)\s*,\s*REVISION:\s*([\d.]+)").ok()?;
            if let Some(caps) = version_regex.captures(line) {
                return Some(format!("L4T {}.{}", caps[1].to_string(), caps[2].to_string()));
            }
        }
    }
    None
}

// Jetson-containers integration
#[command]
async fn list_available_containers() -> Result<Vec<ContainerInfo>, String> {
    info!("Listing available jetson-containers...");
    
    // This would typically query the jetson-containers registry or local cache
    // For now, return a static list of popular containers
    let containers = vec![
        ContainerInfo {
            name: "l4t-pytorch".to_string(),
            tag: "r36.2.0".to_string(),
            category: "ML".to_string(),
            description: "PyTorch with CUDA support for L4T".to_string(),
            size: "2.1 GB".to_string(),
            supported_devices: vec!["AGX Orin".to_string(), "Orin NX".to_string(), "Orin Nano".to_string()],
            is_installed: false,
        },
        ContainerInfo {
            name: "text-generation-webui".to_string(),
            tag: "latest".to_string(),
            category: "LLM".to_string(),
            description: "Web UI for running Large Language Models".to_string(),
            size: "8.5 GB".to_string(),
            supported_devices: vec!["AGX Orin".to_string(), "Orin NX".to_string()],
            is_installed: false,
        },
        ContainerInfo {
            name: "nanollm".to_string(),
            tag: "latest".to_string(),
            category: "LLM".to_string(),
            description: "Optimized LLM inference for Jetson".to_string(),
            size: "3.2 GB".to_string(),
            supported_devices: vec!["AGX Orin".to_string(), "Orin NX".to_string(), "Orin Nano".to_string()],
            is_installed: false,
        },
    ];
    
    Ok(containers)
}

// Pull jetson-container
#[command]
async fn pull_container(container_name: String, tag: String) -> Result<String, String> {
    info!("Pulling container: {}:{}", container_name, tag);
    
    // Use jetson-containers command to pull
    let output = Command::new("jetson-containers")
        .arg("run")
        .arg(format!("{}:{}", container_name, tag))
        .output()
        .map_err(|e| format!("Failed to pull container: {}", e))?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

// Main Tauri application
fn main() {
    env_logger::init();
    info!("Starting CFU - Cordatus Flash Utility");
    
    Builder::default()
        .manage(Arc::new(AppState::default()))
        .invoke_handler(generate_handler![
            load_csv_data,
            detect_usb_devices,
            start_flash_process,
            get_flash_progress,
            cancel_flash_process,
            get_system_info,
            list_available_containers,
            pull_container
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Helper functions for proper script execution
async fn get_script_path() -> Result<String, String> {
    // Try bundled resource first
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let bundled_script = parent.join("flash_cordatus.sh");
            if bundled_script.exists() {
                return Ok(bundled_script.to_string_lossy().to_string());
            }
        }
    }
    
    // Fallback to development paths
    let dev_scripts = vec![
        ("./flash_cordatus.sh", "./flash_cordatus.sh"),
        ("../flash_cordatus.sh", "../flash_cordatus.sh"),
    ];
    
    for (path, result) in dev_scripts {
        let script_path = std::path::PathBuf::from(path);
        if script_path.exists() {
            return Ok(result.to_string());
        }
    }
    
    Err("flash_cordatus.sh script not found".to_string())
}

async fn get_working_directory() -> Result<String, String> {
    // For development, check multiple possible paths
    if std::path::Path::new("./data/template.csv").exists() {
        return Ok(".".to_string());
    }
    
    if std::path::Path::new("../data/template.csv").exists() {
        return Ok("..".to_string());
    }
    
    // For bundled app, use app directory where resources are located
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            return Ok(parent.to_string_lossy().to_string());
        }
    }
    
    Ok("..".to_string()) // Default to parent directory for development
}