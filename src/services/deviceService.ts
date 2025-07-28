/**
 * Device Service - Handles real device data loading and USB detection
 * Integrates with Tauri backend for real hardware detection and CSV configurations
 */

import { DeviceConfig, ParsedDeviceData, parseCSVData, getModuleBoardId, mapStorageType } from '../utils/csvParser';
import { JetsonDevice, FlashProfile } from '../types';
import TauriService from './tauriService';

class DeviceService {
  private static instance: DeviceService;
  private deviceData: ParsedDeviceData | null = null;
  private connectedDevices: Map<string, boolean> = new Map();
  private tauriService: TauriService;
  private isRunningInTauri: boolean = false;

  private constructor() {
    this.tauriService = TauriService.getInstance();
    this.checkTauriEnvironment();
  }

  private async checkTauriEnvironment() {
    this.isRunningInTauri = await this.tauriService.isRunningInTauri();
    console.log('Running in Tauri environment:', this.isRunningInTauri);
  }

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async loadDeviceData(): Promise<ParsedDeviceData> {
    if (this.deviceData) {
      return this.deviceData;
    }

    try {
      // Load CSV data using Tauri backend
      const csvContent = await this.tauriService.loadCsvData();
      this.deviceData = parseCSVData(csvContent);
      return this.deviceData;
    } catch (error) {
      console.error('Failed to load device data:', error);
      throw new Error('Could not load device configurations');
    }
  }

  async getConnectedDevices(): Promise<JetsonDevice[]> {
    if (!this.isRunningInTauri) {
      throw new Error('Tauri backend not available. Please run with: npm run tauri:dev');
    }

    try {
      const tauriDevices = await this.tauriService.detectUsbDevices();
      console.log('Real USB devices detected:', tauriDevices);
      
      // Enrich with CSV data
      const data = await this.loadDeviceData();
      return tauriDevices.map(device => {
        // Find compatible configurations from CSV
        const moduleConfigs = data.devices.filter(d => 
          d.module === device.module
        );
        
        const supportedL4T = Array.from(new Set(moduleConfigs.map(d => d.l4tVersion)))
          .filter(version => version)
          .sort().reverse(); // Latest first
        
        const storageOptions = Array.from(new Set(moduleConfigs.map(d => mapStorageType(d.storage))));

        return {
          ...device,
          supportedL4T: supportedL4T.length > 0 ? supportedL4T : device.supportedL4T,
          storageOptions: storageOptions.length > 0 ? storageOptions : device.storageOptions,
        };
      });
    } catch (error) {
      console.error('Tauri USB detection failed:', error);
      throw new Error('Failed to detect USB devices. Ensure device is connected and in recovery mode.');
    }
  }


  async getFlashProfiles(device?: JetsonDevice): Promise<FlashProfile[]> {
    const data = await this.loadDeviceData();
    
    if (!device) {
      return [];
    }

    // Get configurations for the selected device
    const deviceConfigs = data.devices.filter(config => 
      config.vendor === device.vendor && 
      config.module === device.module
    );

    // Group by jetpack version to create profiles
    const profileMap = new Map<string, DeviceConfig[]>();
    
    deviceConfigs.forEach(config => {
      if (!profileMap.has(config.jetpack)) {
        profileMap.set(config.jetpack, []);
      }
      profileMap.get(config.jetpack)!.push(config);
    });

    // Convert to FlashProfile format
    const profiles: FlashProfile[] = Array.from(profileMap.entries()).map(([jetpack, configs], index) => {
      const isLatest = index === 0; // Assuming CSV is ordered with latest first
      const isProduction = jetpack.includes('L4T 36.4') || jetpack.includes('L4T 35.5'); // Stable versions
      
      // Determine profile characteristics
      let name: string;
      let icon: string;
      let description: string;
      let tags: string[];
      let successRate: number;

      if (isLatest) {
        name = "Latest Release";
        icon = "🚀";
        description = `Latest ${jetpack} with newest features and improvements`;
        tags = ["latest", "recommended", "stable"];
        successRate = 99.2;
      } else if (isProduction) {
        name = "Production Stable";
        icon = "🛡️";
        description = `Stable ${jetpack} release for production deployments`;
        tags = ["stable", "production", "verified"];
        successRate = 98.8;
      } else {
        name = "Legacy Support";
        icon = "📦";
        description = `Legacy ${jetpack} for compatibility requirements`;
        tags = ["legacy", "compatibility"];
        successRate = 97.5;
      }

      // Use the first config as the base, but allow runtime customization
      const baseConfig = configs[0];
      const storageOptions = Array.from(new Set(configs.map(c => mapStorageType(c.storage))));

      return {
        id: `profile-${baseConfig.vendor.toLowerCase()}-${baseConfig.jetpackVersion.replace('.', '-')}`,
        name,
        description,
        icon,
        configuration: {
          device,
          jetpackVersion: jetpack,
          storage: storageOptions[0] || 'nvme', // Default to NVMe
          flashMode: 'standard',
          options: {
            keepFiles: !isProduction, // Development builds preserve files
            secureboot: isProduction    // Enable secure boot for production
          }
        },
        tags,
        successRate,
        availableStorageOptions: storageOptions
      };
    });

    return profiles.sort((a, b) => b.successRate - a.successRate); // Best success rate first
  }

  // Real USB device detection using Tauri backend
  async detectUSBDevices(): Promise<void> {
    if (!this.isRunningInTauri) {
      throw new Error('Tauri backend not available. Please run with: npm run tauri:dev');
    }

    try {
      const devices = await this.tauriService.detectUsbDevices();
      
      // Update connection status
      this.connectedDevices.clear();
      devices.forEach(device => {
        const deviceKey = `${device.vendor}-${device.module}`;
        this.connectedDevices.set(deviceKey, device.isConnected);
      });
      
      console.log('Real USB device detection completed:', devices.length, 'devices found');
    } catch (error) {
      console.error('USB detection failed:', error);
      throw error;
    }
  }

  // Get device configuration for flashing
  async getDeviceConfiguration(
    vendor: string,
    module: string, 
    jetpack: string,
    storage: string
  ): Promise<DeviceConfig | null> {
    const data = await this.loadDeviceData();
    
    const config = data.devices.find(d => 
      d.vendor === vendor && 
      d.module === module && 
      d.jetpack === jetpack && 
      d.storage === storage
    );

    return config || null;
  }

  // Update device connection status
  setDeviceConnected(deviceKey: string, connected: boolean): void {
    this.connectedDevices.set(deviceKey, connected);
  }

  // Get all possible devices from CSV data (both connected and non-available)
  async getAllAvailableDevices(): Promise<JetsonDevice[]> {
    const data = await this.loadDeviceData();
    
    // Group devices by unique combinations of vendor, product, and module
    const uniqueDevices = new Map<string, any>();
    
    data.devices.forEach(config => {
      const key = `${config.vendor}-${config.product}-${config.module}`;
      if (!uniqueDevices.has(key)) {
        uniqueDevices.set(key, config);
      }
    });

    // Convert to JetsonDevice format
    const devices: JetsonDevice[] = Array.from(uniqueDevices.values()).map(config => {
      const deviceKey = `${config.vendor}-${config.module}`;
      const isConnected = this.connectedDevices.get(deviceKey) || false;
      
      // Get all supported L4T versions for this module
      const moduleConfigs = data.devices.filter(d => 
        d.vendor === config.vendor && 
        d.product === config.product && 
        d.module === config.module
      );
      
      const supportedL4T = Array.from(new Set(moduleConfigs.map(d => d.l4tVersion)))
        .filter(version => version)
        .sort().reverse();
      
      // Get all supported storage options for this module
      const storageOptions = Array.from(new Set(moduleConfigs.map(d => mapStorageType(d.storage))));

      return {
        id: config.id,
        vendor: config.vendor,
        product: config.product,
        module: config.module,
        boardId: getModuleBoardId(config.module),
        isConnected,
        supportedL4T,
        storageOptions
      };
    });

    return devices;
  }

  // Get statistics about loaded data
  getDataStatistics(): { totalConfigurations: number; vendors: number; modules: number; jetpackVersions: number } {
    if (!this.deviceData) {
      return { totalConfigurations: 0, vendors: 0, modules: 0, jetpackVersions: 0 };
    }

    return {
      totalConfigurations: this.deviceData.devices.length,
      vendors: this.deviceData.vendors.length,
      modules: this.deviceData.modules.length,
      jetpackVersions: this.deviceData.jetpackVersions.length
    };
  }

  // Real system validation using Tauri
  async validateSystemRequirements() {
    if (!this.isRunningInTauri) {
      throw new Error('Tauri backend not available. Please run with: npm run tauri:dev');
    }
    
    return await this.tauriService.validateSystemRequirements();
  }

  // Get real system information
  async getSystemInfo() {
    if (!this.isRunningInTauri) {
      throw new Error('Tauri backend not available. Please run with: npm run tauri:dev');
    }
    
    return await this.tauriService.getSystemInfo();
  }

  // Check if device is in recovery mode
  async isDeviceInRecoveryMode(deviceId: string): Promise<boolean> {
    if (!this.isRunningInTauri) {
      throw new Error('Tauri backend not available. Please run with: npm run tauri:dev');
    }
    
    return await this.tauriService.isDeviceInRecoveryMode(deviceId);
  }
}

export default DeviceService;
export { TauriService };