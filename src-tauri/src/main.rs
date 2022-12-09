#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use human_sort;
use std::fs;
use std::path::Path;

fn is_img_extension(extension: &str) -> bool {
    let ex = vec!["png", "jpg", "jpeg", "bmp", "webp"];
    ex.iter().any(|e| *e == extension.to_lowercase())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
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

    files.sort_unstable_by(|a, b| human_sort::compare(&a, &b));

    files
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_images])
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
