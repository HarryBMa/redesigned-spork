# Surgical Inventory System

A headless surgical inventory system that logs barcode scans from sterile storage, built with Electron, React, TypeScript, and SQLite.

## Features

- **Headless Operation**: Runs silently in the background/system tray
- **Barcode Trigger Activation**: Activated by scanning trigger barcodes (e.g., SCAN_START)
- **Auto-closing Scan Window**: Opens minimal scan window, auto-closes after configurable inactivity
- **Item Tracking**: Logs check-out (leaving sterile storage) and check-in (returning from sterilization)
- **Automatic Categorization**: Items categorized by barcode prefix (e.g., KÄKX = Käkkirurgi)
- **Persistent Storage**: SQLite database for reliable data storage
- **Export Capabilities**: Export data as CSV/JSON for Excel or backup
- **Wireless Scanner Support**: Works with wireless barcode scanners (keyboard emulation)
- **Global Hotkeys**: Fallback activation via keyboard shortcuts
- **Configurable Settings**: Adjustable inactivity timeout and categories

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Windows, macOS, or Linux

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd surgical-inventory-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the application in development mode:

```bash
npm run dev
```

This will start both the Vite development server and Electron simultaneously.

## Building

Build the application for production:

```bash
npm run build
```

Build for Windows distribution:

```bash
npm run build:win
```

## Default Categories

- **KÄKX** - Käkkirurgi (Jaw Surgery)
- **ORTO** - Ortopedi (Orthopedics)
- **CARD** - Kardio (Cardiovascular)
- **NEUR** - Neuro (Neurosurgery)
- **ALLM** - Allmän Kirurgi (General Surgery)
- **PLAS** - Plastik (Plastic Surgery)
- **UROL** - Urologi (Urology)
- **GYNE** - Gynekologi (Gynecology)
    ...reactDom.configs.recommended.rules,
  },
})
```
