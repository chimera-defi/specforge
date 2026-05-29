use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

/// Holds references to sidecar child processes so they can be killed on shutdown.
struct Sidecars {
    children: Vec<Child>,
}

impl Sidecars {
    fn new() -> Self {
        Self {
            children: Vec::new(),
        }
    }

    fn add(&mut self, child: Child) {
        self.children.push(child);
    }

    fn kill_all(&mut self) {
        for child in self.children.iter_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.children.clear();
    }
}

impl Drop for Sidecars {
    fn drop(&mut self) {
        self.kill_all();
    }
}

#[tauri::command]
async fn get_health() -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();

    let web_ok = client
        .get("http://localhost:3000/api/health")
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);

    let collab_ok = client
        .get("http://127.0.0.1:4322/health")
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);

    Ok(serde_json::json!({
        "web": web_ok,
        "collab": collab_ok,
        "ready": web_ok && collab_ok
    }))
}

#[tauri::command]
async fn get_service_logs() -> Result<serde_json::Value, String> {
    // Check if we can access recent logs from the services
    // This is a simplified version - in production, you'd want proper log file rotation
    let logs = serde_json::json!({
        "web": {
            "status": "available",
            "log_path": "../web/.data/logs",
            "note": "Web app logs available in .data/logs directory"
        },
        "collab": {
            "status": "available",
            "log_path": "../collab-server/.data/logs",
            "note": "Collab server logs available in .data/logs directory"
        },
        "instructions": "Use terminal to view logs: tail -f web/.data/logs/app.log"
    });

    Ok(logs)
}

#[tauri::command]
async fn get_version() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "version": env!("CARGO_PKG_VERSION"),
        "tauri": tauri::VERSION,
        "platform": std::env::consts::OS
    }))
}

/// Spawn sidecar processes for the web app and collab server.
/// Returns the child processes so they can be managed.
fn spawn_sidecars() -> Vec<Child> {
    let mut children = Vec::new();

    // Determine project root (two levels up from src-tauri)
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()));

    // In dev mode, use CARGO_MANIFEST_DIR or fall back to relative paths
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
        .map(std::path::PathBuf::from)
        .ok();

    let base = manifest_dir
        .as_ref()
        .and_then(|d| d.parent().map(|p| p.to_path_buf()))
        .or(exe_dir)
        .unwrap_or_else(|| std::path::PathBuf::from("."));

    let web_dir = base.join("../web");
    let collab_dir = base.join("../collab-server");

    // Start collab server
    if collab_dir.exists() {
        match Command::new("bun")
            .args(["run", "start"])
            .current_dir(&collab_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(child) => children.push(child),
            Err(e) => eprintln!("Failed to start collab server: {e}"),
        }
    }

    // Start web app
    if web_dir.exists() {
        match Command::new("bun")
            .args(["run", "start"])
            .current_dir(&web_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(child) => children.push(child),
            Err(e) => eprintln!("Failed to start web app: {e}"),
        }
    }

    children
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_health,
            get_service_logs,
            get_version
        ])
        .setup(|app| {
            // Spawn sidecar processes
            let spawned = spawn_sidecars();
            let mut sidecars = Sidecars::new();
            for child in spawned {
                sidecars.add(child);
            }
            app.manage(Mutex::new(sidecars));

            let win = app.get_webview_window("main").unwrap();
            win.set_title("SpecForge").unwrap();

            // Clean up sidecars when the main window closes
            let app_handle = app.handle().clone();
            win.on_window_event(move |event| {
                if let tauri::WindowEvent::Destroyed = event {
                    if let Some(state) = app_handle.try_state::<Mutex<Sidecars>>() {
                        if let Ok(mut s) = state.lock() {
                            s.kill_all();
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
