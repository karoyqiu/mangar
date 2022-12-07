#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use base64;
use std::fs;
use std::path::Path;
use tauri::http;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

fn is_img_extension(extension: &str) -> bool {
    let ex = vec!["png", "jpg", "jpeg", "bmp", "webp"];
    ex.iter().any(|e| *e == extension.to_lowercase())
}

#[tauri::command]
fn read_images(dir: &str) -> Vec<String> {
    let dir = Path::new(&dir);
    let mut files: Vec<String> = Vec::new();

    for entry in fs::read_dir(&dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        let ext = path
            .extension()
            .unwrap_or_default()
            .to_str()
            .unwrap_or_default();

        if is_img_extension(&ext) {
            let name = path.file_name();

            if let Some(name) = name {
                files.push(name.to_str().unwrap().to_string())
            }
        }
    }

    files
}

fn img_handler<R: tauri::Runtime>(
    _app: &tauri::AppHandle<R>,
    request: &http::Request,
) -> Result<http::Response, Box<dyn std::error::Error>> {
    let res_not_img = http::ResponseBuilder::new().status(400).body(Vec::new());

    if request.method() != "GET" {
        return res_not_img;
    }

    let uri = request.uri();
    let mut parts = uri.rsplit('/');
    let filename = parts.next().unwrap();
    let filename = base64::decode(&filename)?;
    let filename = String::from_utf8(filename)?;
    let path = Path::new(&filename);
    let extension = match path.extension() {
        Some(_ex) => _ex.to_string_lossy().to_string(),
        None => return res_not_img,
    };
    println!("🚩Request: {:?}", path);

    let local_img = if let Ok(data) = fs::read(path) {
        http::ResponseBuilder::new()
            .mimetype(format!("image/{}", &extension).as_str())
            .body(data)
    } else {
        res_not_img
    };

    local_img
}

fn main() {
    tauri::Builder::default()
        //.invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![read_images])
        .register_uri_scheme_protocol("img", img_handler)
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
