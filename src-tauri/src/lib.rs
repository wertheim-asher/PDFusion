use tauri::WebviewWindowBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // The main window is created here (its config has `"create": false`) so it can register a
      // download handler. macOS's WKWebView cancels every download unless one is registered, which
      // would make "Download" silently do nothing there; Windows (WebView2) saves without one.
      // Returning `true` allows the download — the webview layer already saves into the user's
      // Downloads folder and appends " (1)", " (2)"… rather than overwriting an existing file.
      WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?
        .on_download(|_webview, _event| true)
        .build()?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
