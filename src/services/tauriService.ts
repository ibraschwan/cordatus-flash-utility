/**
 * Tauri Service - Bridge between React frontend and Rust backend
 * Handles real USB detection, flashing, and container management
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { JetsonDevice, FlashProgress, FlashCommand, SystemInfo } from '../types';

export interface UsbDeviceInfo {
  vendor_id: number;
  product_id: number;
  device_path: string;
  bus_number: number;
  device_address: number;
  is_recovery_mode: boolean;
}

export interface TauriJetsonDevice extends JetsonDevice {
  usb_info?: UsbDeviceInfo;
}

export interface ContainerInfo {
  name: string;
  tag: string;
  category: string;
  description: string;
  size: string;
  supported_devices: string[];
  is_installed: boolean;
}

class TauriService {
  private static instance: TauriService;
  private progressListeners: Map<string, (progress: FlashProgress) => void> = new Map();

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): TauriService {
    if (!TauriService.instance) {
      TauriService.instance = new TauriService();
    }
    return TauriService.instance;
  }

  private async setupEventListeners() {
    try {
      // Listen for flash progress updates
      await listen<{flash_id: string, progress: FlashProgress}>('flash-progress-update', (event) => {
        const { flash_id, progress } = event.payload;
        const listener = this.progressListeners.get(flash_id);
        if (listener) {
          listener(progress);
        }
      });

      console.log('Tauri event listeners set up successfully');
    } catch (error) {
      console.error('Failed to set up Tauri event listeners:', error);
    }
  }

  // Load CSV data from bundled resources
  async loadCsvData(): Promise<string> {
    try {
      const csvContent = await invoke<string>('load_csv_data');
      return csvContent;
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      throw new Error('Could not load device configuration data');
    }
  }

  // USB Device Detection
  async detectUsbDevices(): Promise<TauriJetsonDevice[]> {
    try {
      const devices = await invoke<TauriJetsonDevice[]>('detect_usb_devices');
      console.log('Detected USB devices:', devices);
      return devices.map(device => ({
        ...device,
        // Convert snake_case from Rust to camelCase for TypeScript
        boardId: device.board_id || device.boardId,
        isConnected: device.is_connected ?? device.isConnected,
        supportedL4T: device.supported_l4t || device.supportedL4T,
        storageOptions: device.storage_options || device.storageOptions,
      }));
    } catch (error) {
      console.error('Failed to detect USB devices:', error);
      throw new Error(`USB detection failed: ${error}`);
    }
  }

  // Flash Process Management
  async startFlashProcess(command: FlashCommand): Promise<string> {
    try {
      const flashId = await invoke<string>('start_flash_process', {
        command: {
          product: command.product,
          device_module: command.deviceModule,
          jetpack_version: command.jetpackVersion,
          storage_device: command.storageDevice,
          keep_files: command.keepFiles,
          user_name: command.userName,
        }
      });

      console.log('Started flash process with ID:', flashId);
      return flashId;
    } catch (error) {
      console.error('Failed to start flash process:', error);
      throw new Error(`Flash process failed to start: ${error}`);
    }
  }

  async getFlashProgress(flashId: string): Promise<FlashProgress | null> {
    try {
      const progress = await invoke<FlashProgress | null>('get_flash_progress', { flashId });
      return progress;
    } catch (error) {
      console.error('Failed to get flash progress:', error);
      return null;
    }
  }

  async cancelFlashProcess(flashId: string): Promise<void> {
    try {
      await invoke('cancel_flash_process', { flashId });
      console.log('Cancelled flash process:', flashId);
    } catch (error) {
      console.error('Failed to cancel flash process:', error);
      throw new Error(`Failed to cancel flash process: ${error}`);
    }
  }

  // Progress Monitoring
  onFlashProgress(flashId: string, callback: (progress: FlashProgress) => void): () => void {
    this.progressListeners.set(flashId, callback);
    
    // Return cleanup function
    return () => {
      this.progressListeners.delete(flashId);
    };
  }

  // System Information
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const systemInfo = await invoke<SystemInfo>('get_system_info');
      console.log('System info:', systemInfo);
      return {
        ...systemInfo,
        totalMemory: systemInfo.total_memory || systemInfo.totalMemory,
        availableSpace: systemInfo.available_space || systemInfo.availableSpace,
        dockerInstalled: systemInfo.docker_installed ?? systemInfo.dockerInstalled,
        nvidiaDockerInstalled: systemInfo.nvidia_docker_installed ?? systemInfo.nvidiaDockerInstalled,
        jetpackVersion: systemInfo.jetpack_version || systemInfo.jetpackVersion,
      };
    } catch (error) {
      console.error('Failed to get system info:', error);
      throw new Error(`System info retrieval failed: ${error}`);
    }
  }

  // Container Management
  async listAvailableContainers(): Promise<ContainerInfo[]> {
    try {
      const containers = await invoke<ContainerInfo[]>('list_available_containers');
      console.log('Available containers:', containers);
      return containers.map(container => ({
        ...container,
        supportedDevices: container.supported_devices || container.supportedDevices,
        isInstalled: container.is_installed ?? container.isInstalled,
      }));
    } catch (error) {
      console.error('Failed to list containers:', error);
      throw new Error(`Container listing failed: ${error}`);
    }
  }

  async pullContainer(containerName: string, tag: string): Promise<string> {
    try {
      const result = await invoke<string>('pull_container', {
        containerName,
        tag,
      });
      console.log('Container pull result:', result);
      return result;
    } catch (error) {
      console.error('Failed to pull container:', error);
      throw new Error(`Container pull failed: ${error}`);
    }
  }

  // Utility Methods
  async isRunningInTauri(): Promise<boolean> {
    try {
      await invoke('detect_usb_devices');
      return true;
    } catch {
      return false;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: 'ok' | 'error', message?: string }> {
    try {
      await this.getSystemInfo();
      return { status: 'ok' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Recovery Mode Detection
  async isDeviceInRecoveryMode(deviceId: string): Promise<boolean> {
    try {
      const devices = await this.detectUsbDevices();
      const device = devices.find(d => d.id === deviceId);
      return device?.usb_info?.is_recovery_mode ?? false;
    } catch (error) {
      console.error('Failed to check recovery mode:', error);
      return false;
    }
  }

  // Format storage size from bytes
  formatStorageSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Validate system requirements
  async validateSystemRequirements(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const systemInfo = await this.getSystemInfo();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check minimum memory (8GB recommended)
      if (systemInfo.totalMemory < 8 * 1024 * 1024 * 1024) {
        issues.push('Insufficient RAM: Less than 8GB detected');
        recommendations.push('Consider upgrading to at least 8GB RAM for optimal performance');
      }

      // Check available storage (50GB recommended)
      if (systemInfo.availableSpace < 50 * 1024 * 1024 * 1024) {
        issues.push('Low storage space: Less than 50GB available');
        recommendations.push('Free up disk space or add external storage');
      }

      // Check Docker installation
      if (!systemInfo.dockerInstalled) {
        issues.push('Docker not installed');
        recommendations.push('Install Docker to enable container functionality');
      }

      // Check NVIDIA Docker runtime
      if (systemInfo.dockerInstalled && !systemInfo.nvidiaDockerInstalled) {
        issues.push('NVIDIA Container Runtime not installed');
        recommendations.push('Install nvidia-docker for GPU container support');
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        valid: false,
        issues: ['Failed to validate system requirements'],
        recommendations: ['Check system connectivity and permissions'],
      };
    }
  }
}

export default TauriService;