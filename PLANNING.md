# PLANNING.md

This file is preserved as requested. All other project files and folders have been deleted.

# Barcode Logging App – Complete Planning & AI Prompt

## 1. Project Overview

A cross-platform desktop app for logging equipment in/out using barcode scanners. Runs in the background with a system tray, logs scans to SQLite, and provides a minimal UI for admin tasks.

---

## 1a. Inventory Use Case

Remember, this is a simple in and out log for keeping track of surgical inventory that has been used and has been sent to sterilisation. Data will be added when item is taken from storage to be used and sent, that data will be removed when the same item is back from sterilisation and entered into storage.

---

## 2. Step-by-Step AI Prompt for App Creation

**Prompt:**

> "Create a Tauri-based desktop app for barcode logging with the following features:
> 
> 1. **Background Service & System Tray:**  
>    - Use Tauri’s system tray API for a persistent tray icon.  
>    - Enable auto-start on OS boot (Tauri auto-launch plugin).
> 
> 2. **Barcode Input Detection:**  
>    - Listen for global keyboard input using a Rust crate (e.g., rdev).  
>    - Enter 'scanner mode' on a special trigger barcode (e.g., #TRIGGER).  
>    - Capture barcode input, log it, then auto-hide/minimize the window.
> 
> 3. **Logging to SQLite:**  
>    - Use rusqlite to log each scan with timestamp, barcode, direction (in/out), and department prefix.  
>    - Determine direction by last state for each item.
> 
> 4. **System Tray Menu (Admin Panel):**  
>    - Allow viewing equipment status, configuring department prefixes, exporting logs (CSV/JSON), and clearing logs.
> 
> 5. **Minimal UI:**  
>    - Minimal React UI, shown only on demand from the tray.
> 
> 6. **Wireless Scanner Support:**  
>    - Ensure compatibility with keyboard-emulating barcode scanners.
> 
> 7. **Export/Import:**  
>    - Use Tauri file APIs for exporting logs.
> 
> 8. **Cross-platform:**  
>    - Support Windows, macOS, and Linux.
> 
> Please provide code structure, main files, and integration points between Rust (backend) and React (frontend)."

---

## 3. Dependencies to Install

### JavaScript/Frontend (npm)
- `react`, `react-dom` – UI framework
- `vite` – Build tool
- `@vitejs/plugin-react` – Vite React plugin
- `@tauri-apps/api` – Tauri JS API
- `@tauri-apps/cli` (dev) – Tauri CLI
- `@radix-ui/react-*` – UI primitives (alert-dialog, scroll-area, separator, slot, tabs)
- `shadcn` – UI components
- `tailwindcss`, `@tailwindcss/vite`, `tailwindcss-animate`, `tw-animate-css`, `tailwind-merge` – Styling
- `clsx`, `class-variance-authority` – Utility for class names
- `lucide-react` – Icons
- `table` – Table rendering

### Rust/Backend (Cargo)
- `tauri` (with `system-tray`, `tray-icon` features)
- `tauri-plugin-autostart` – Auto-launch
- `rusqlite` (with `bundled` feature) – SQLite database
- `chrono` (with `serde` feature) – Timestamps
- `serde`, `serde_json` – Serialization
- `rdev` – Global input listening
- `csv` – CSV export
- `rust_xlsxwriter` – Excel export (optional)

---

## 4. Implementation Steps

1. **Initialize Tauri + React project**  
   - `npm create tauri-app`
   - Set up Vite + React + Tailwind

2. **Implement system tray and auto-launch**  
   - Use Tauri APIs and plugins

3. **Set up global input listener in Rust**  
   - Use `rdev` to detect barcode input

4. **Design SQLite schema and logging logic**  
   - Use `rusqlite` for CRUD operations

5. **Create minimal React UI**  
   - For admin panel and status viewing

6. **Integrate frontend and backend**  
   - Use Tauri commands for communication

7. **Implement export/import features**  
   - Use Tauri file APIs and Rust CSV/XLSX libraries

8. **Test with wireless barcode scanners**  
   - Ensure fast input is captured correctly

---

## 5. Example Architecture Flow

1. App launches, tray icon appears, input listener starts.
2. User scans #TRIGGER barcode, app enters scanner mode.
3. User scans item barcode, app logs it with timestamp, direction, and department.
4. App auto-hides/minimizes, returns to background.
5. Admin uses tray menu to view/export logs or configure settings.

---

## 6. References

- [Tauri Docs](https://tauri.app/v2/guides/)
- [rdev crate](https://crates.io/crates/rdev)
- [rusqlite crate](https://crates.io/crates/rusqlite)
- [shadcn/ui](https://ui.shadcn.com/)

---
