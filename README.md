tauri.conf.json
Set decorations to false in your tauri.conf.json:

tauri.conf.json
"tauri": {
  "windows": [
    {
      "decorations": false
    }
  ]
}

Permissions
Add window permissions in capability file.

By default, all plugin commands are blocked and cannot be accessed. You must define a list of permissions in your capabilities configuration.

See the Capabilities Overview for more information and the step by step guide to use plugin permissions.

src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:window:default", "core:window:allow-start-dragging"]
}

Permission	Description
core:window:default	Default permissions for the plugin. Except window:allow-start-dragging.
core:window:allow-close	Enables the close command without any pre-configured scope.
core:window:allow-minimize	Enables the minimize command without any pre-configured scope.
core:window:allow-start-dragging	Enables the start_dragging command without any pre-configured scope.
core:window:allow-toggle-maximize	Enables the toggle_maximize command without any pre-configured scope.
core:window:allow-internal-toggle-maximize	Enables the internal_toggle_maximize command without any pre-configured scope.
CSS
Add this CSS sample to keep it at the top of the screen and style the buttons:

.titlebar {
  height: 30px;
  background: #329ea3;
  user-select: none;
  display: flex;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
.titlebar-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  user-select: none;
  -webkit-user-select: none;
}
.titlebar-button:hover {
  background: #5bbec3;
}

HTML
Put this at the top of your <body> tag:

<div data-tauri-drag-region class="titlebar">
  <div class="titlebar-button" id="titlebar-minimize">
    <img
      src="https://api.iconify.design/mdi:window-minimize.svg"
      alt="minimize"
    />
  </div>
  <div class="titlebar-button" id="titlebar-maximize">
    <img
      src="https://api.iconify.design/mdi:window-maximize.svg"
      alt="maximize"
    />
  </div>
  <div class="titlebar-button" id="titlebar-close">
    <img src="https://api.iconify.design/mdi:close.svg" alt="close" />
  </div>
</div>

Note that you may need to move the rest of your content down so that the titlebar doesn’t cover it.

JavaScript
Use this code snippet to make the buttons work:

import { getCurrentWindow } from '@tauri-apps/api/window';

// when using `"withGlobalTauri": true`, you may use
// const { getCurrentWindow } = window.__TAURI__.window;

const appWindow = getCurrentWindow();

document
  .getElementById('titlebar-minimize')
  ?.addEventListener('click', () => appWindow.minimize());
document
  .getElementById('titlebar-maximize')
  ?.addEventListener('click', () => appWindow.toggleMaximize());
document
  .getElementById('titlebar-close')
  ?.addEventListener('click', () => appWindow.close());

Note that if you are using a Rust-based frontend, you can copy the code above into a <script> element in your index.html file.