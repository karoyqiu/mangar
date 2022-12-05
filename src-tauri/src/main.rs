#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use base64;
use std::fs;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[tauri::command]
fn read_images(dir: &str) -> Vec<String> {
    let dir = Path::new(&dir);
    let mut files: Vec<String> = Vec::new();

    for entry in fs::read_dir(&dir).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();

        if path.is_file() {
            let content = fs::read(&path);
            files.push(base64::encode_config(
                content.unwrap(),
                base64::STANDARD_NO_PAD,
            ));
        }
    }

    files
}

fn main() {
    tauri::Builder::default()
        //.invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![read_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
