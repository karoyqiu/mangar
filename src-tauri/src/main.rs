#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use human_sort;
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use tauri::http::{HttpRange, ResponseBuilder};

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
        .register_uri_scheme_protocol("pdf", move |_app, request| {
            // prepare our response
            let mut response = ResponseBuilder::new()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Expose-Headers", "Accept-Ranges")
                .header("Accept-Ranges", "bytes");

            // get the file path
            let path = request.uri().strip_prefix("pdf://localhost/").unwrap();
            let path = percent_encoding::percent_decode(path.as_bytes())
                .decode_utf8_lossy()
                .to_string();

            // read our file
            let mut content = std::fs::File::open(&path)?;
            let mut buf = Vec::new();

            // default status code
            let mut status_code = 200;
            // Get the file size
            let file_size = content.metadata().unwrap().len();

            // if the webview sent a range header, we need to send a 206 in return
            // Actually only macOS and Windows are supported. Linux will ALWAYS return empty headers.
            if let Some(range) = request.headers().get("range") {
                // we parse the range header with tauri helper
                let range = HttpRange::parse(range.to_str().unwrap(), file_size).unwrap();
                // let support only 1 range for now
                let first_range = range.first();
                if let Some(range) = first_range {
                    let mut real_length = range.length;

                    // prevent max_length;
                    // specially on webview2
                    if range.length > file_size / 3 {
                        // max size sent (400ko / request)
                        // as it's local file system we can afford to read more often
                        real_length = std::cmp::min(file_size - range.start, 1024 * 400);
                    }

                    // last byte we are reading, the length of the range include the last byte
                    // who should be skipped on the header
                    let last_byte = range.start + real_length - 1;
                    // partial content
                    status_code = 206;

                    // Only macOS and Windows are supported, if you set headers in linux they are ignored
                    response = response
                        .header("Connection", "Keep-Alive")
                        .header("Accept-Ranges", "bytes")
                        .header("Content-Length", real_length)
                        .header(
                            "Content-Range",
                            format!("bytes {}-{}/{}", range.start, last_byte, file_size),
                        );

                    // FIXME: Add ETag support (caching on the webview)

                    // seek our file bytes
                    content.seek(SeekFrom::Start(range.start))?;
                    content.take(real_length).read_to_end(&mut buf)?;
                } else {
                    content.read_to_end(&mut buf)?;
                }
            } else {
                response = response.header("Content-Length", file_size);
            }

            response
                .mimetype("application/pdf")
                .status(status_code)
                .body(buf)
        })
        .register_uri_scheme_protocol("zip", move |_app, request| {
            // prepare our response
            let response = ResponseBuilder::new().header("Access-Control-Allow-Origin", "*");

            // get the file path
            let path = request.uri().strip_prefix("zip://localhost/").unwrap();
            let filepath;
            let index;

            if let Some(pos) = path.rfind('?') {
                println!("Pos: {}", pos);
                let query = &path[pos + 1..];
                filepath = &path[0..pos];
                index = query.parse().unwrap();
            } else {
                filepath = &path;
                index = std::usize::MAX;
            }

            let path = percent_encoding::percent_decode(filepath.as_bytes())
                .decode_utf8_lossy()
                .to_string();
            let file = fs::File::open(path).unwrap();
            let mut zip = zip::ZipArchive::new(file).unwrap();
            let mut body: Vec<u8> = Vec::new();

            if index == std::usize::MAX {
                println!("Len: {}", zip.len());
                body = zip.len().to_string().as_bytes().to_vec();
            } else {
                let mut file = zip.by_index(index).unwrap();
                file.read_to_end(&mut body).unwrap();
            }

            response.status(200).body(body)
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
