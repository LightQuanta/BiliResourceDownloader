use std::fs::File;
use std::io::{BufReader, BufWriter};
use image::codecs::webp::WebPDecoder;
use image::{AnimationDecoder, ImageDecoder};
use image::{ GenericImageView};
use gif::{Encoder, Frame, Repeat };

#[tauri::command]
pub fn open_webview_devtools(webview_window: tauri::WebviewWindow) {
  webview_window.open_devtools();
}

#[tauri::command]
pub fn convert_webp2gif(input_path: String, output_path: String) -> Result<(), String> {
  // 打开WebP文件
  let webp_file = File::open(&input_path).map_err(|e| e.to_string())?;
  let webp_reader = BufReader::new(webp_file);
  let decoder = WebPDecoder::new(webp_reader).map_err(|e| e.to_string())?;
  let (width, height) = decoder.dimensions();

  // 创建输出 GIF 文件
  let gif_file = File::create(&output_path).map_err(|e| e.to_string())?;
  let mut gif_encoder = Encoder::new(BufWriter::new(gif_file), width as u16, height as u16, &[]).map_err(|e| e.to_string())?;
  gif_encoder.set_repeat(Repeat::Infinite).map_err(|e| e.to_string())?;

  // 解码 WebP 帧并将其编码为 GIF 帧
  for frame in decoder.into_frames() {
    let frame = frame.map_err(|e| e.to_string())?;
    let buffer = frame.into_buffer();
    let gif_frame = Frame::from_rgba_speed(buffer.width() as u16, buffer.height() as u16, &mut buffer.into_raw(), 10);
    gif_encoder.write_frame(&gif_frame).map_err(|e| e.to_string())?;
  }
  Ok(())
}