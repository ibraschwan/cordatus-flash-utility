# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CFU - Cordatus Flash Utility** - A premium, modern desktop application for flashing NVIDIA Jetson devices. Built with Tauri + React + TypeScript, providing professional-grade device flashing with an elegant glassmorphic UI and integrated model management.

**Developer**: İbrahim Çoban

## Commands

### Development
```bash
npm install          # Install dependencies
npm run tauri:dev   # Start Tauri development server (frontend + backend)
npm run dev         # Start Vite only (frontend only - MOCK DATA)
npm run build       # Build for production
npm run preview     # Preview production build
```

**IMPORTANT**: Always use `npm run tauri:dev` for development to access real USB detection and data. Using `npm run dev` will show mock data and errors.

### Legacy Python Version (Backup)
```bash
python3 main.py     # Run original PySimpleGUI version
```

### Direct Script Execution (Advanced)
```bash
./flash_cordatus.sh <product> <device_module> <jetpack_version> <storage_device> <keep_files> <user_name>
```

## Architecture

**Modern Premium App (Primary)**:
1. **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion
   - `src/App.tsx`: Main application with 4-tab navigation
   - `src/components/`: Premium UI components (DeviceSelection, FlashingProgress, Models, Settings)
   - `src/types/`: TypeScript type definitions matching real data structures
   - Glassmorphic design with premium animations

2. **Data Layer**: Real data integration (NO MOCK DATA)
   - Parse `data/template.csv`: 115+ real device configurations
   - Parse `data/urls.sh`: Actual JetPack download URLs
   - Device compatibility validation from CSV data
   - Real USB device detection and mapping

3. **Backend**: Rust (Tauri) for native performance
   - `src-tauri/src/lib.rs`: Main Tauri application
   - `src-tauri/src/device.rs`: Real USB device detection
   - `src-tauri/src/flash.rs`: flash_cordatus.sh integration
   - `src-tauri/src/csv.rs`: Template.csv parsing

4. **Flashing Engine**: Direct flash_cordatus.sh integration
   - Execute existing bash script with real parameters
   - Parse script output for real-time progress tracking
   - Stream actual logs to terminal component
   - Handle all bash script error conditions

**App Navigation Structure**:
- **Devices Tab**: Device selection with real USB detection
- **Flash Tab**: Real-time flashing progress and controls
- **Models Tab**: Prebuilt libraries and AI models catalog
- **Settings Tab**: Configuration and preferences

**Legacy Python App (Backup)**:
- `main.py`: Original PySimpleGUI interface
- `PySimpleGUI.py`: Local PySimpleGUI library
- `flash_cordatus.sh`: Proven core flashing logic

## Key Development Notes

### Real Data Integration
- **NO MOCK DATA**: All data comes from real sources
- Device compatibility from `data/template.csv` (115+ configurations)
- JetPack URLs from `data/urls.sh` 
- Real USB device detection via system APIs
- Actual bash script execution and progress parsing

### Device Management
- Parse template.csv for device compatibility matrix
- Map USB Product IDs to actual Jetson devices
- Real-time connection status monitoring  
- Support for all vendors: OmniWise, Devkit, Avermedia, Seeed Studio
- All JetPack versions from 4.6.1 to 6.2.1+
- Storage options: NVMe SSD, Micro SD, eMMC, USB

### Flashing Process
- Execute `./flash_cordatus.sh` with real parameters from UI
- Parse wget download progress for real-time updates
- Track tar extraction and flash.sh stages
- Stream all script output to terminal component
- Handle system requirements (Ubuntu version, sudo, udisks2)
- Support process cancellation and error recovery

### Models/Prebuilt Libraries Section
- Replace Analytics with useful model management
- Categories: Computer Vision, NLP, Robotics, Edge AI
- Model download and installation to flashed devices
- Performance benchmarks per Jetson device type
- Integration examples and documentation
- Version management and updates

### System Integration
- Check Ubuntu compatibility (18.04, 20.04, 22.04)
- Verify sudo permissions and system tools
- Handle udisks2 service management
- Create proper ~/openzeka/ directories
- Comprehensive error handling and logging

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Rust, Tauri for system integration
- **Data**: CSV parsing, real USB enumeration
- **Process**: Subprocess execution of bash script
- **UI**: Glassmorphic design with premium animations
- **Build**: Vite for fast development

### Logo Assets
- Square logo: `image.png`
- Full logo with text: `image copy.png`