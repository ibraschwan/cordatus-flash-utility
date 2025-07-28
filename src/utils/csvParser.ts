/**
 * CSV Parser utility for reading device configurations from template.csv
 * Parses the device data without mock values for real CFU functionality
 */

export interface DeviceConfig {
  vendor: string;
  product: string;
  module: string;
  jetpack: string;
  storage: string;
  // Computed fields
  id: string;
  l4tVersion: string;
  jetpackVersion: string;
}

export interface ParsedDeviceData {
  devices: DeviceConfig[];
  vendors: string[];
  modules: string[];
  jetpackVersions: string[];
  storageTypes: string[];
}

export function parseCSVData(csvContent: string): ParsedDeviceData {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const header = lines[0];
  const dataLines = lines.slice(1);

  const devices: DeviceConfig[] = [];
  const vendors = new Set<string>();
  const modules = new Set<string>();
  const jetpackVersions = new Set<string>();
  const storageTypes = new Set<string>();

  dataLines.forEach((line, index) => {
    const columns = line.split(',').map(col => col.trim());
    
    if (columns.length >= 5) {
      const [vendor, product, module, jetpack, storage] = columns;
      
      // Generate unique ID based on configuration
      const id = `${vendor.toLowerCase().replace(/\s+/g, '-')}-${product.toLowerCase().replace(/\s+/g, '-')}-${module.toLowerCase().replace(/\s+/g, '-')}-${index}`;
      
      // Extract L4T version from jetpack string (e.g., "6.2 - L4T 36.4.3" -> "36.4.3")
      const l4tMatch = jetpack.match(/L4T\s+([\d.]+)/);
      const l4tVersion = l4tMatch ? l4tMatch[1] : '';
      
      // Extract jetpack version (e.g., "6.2 - L4T 36.4.3" -> "6.2")
      const jetpackMatch = jetpack.match(/^([\d.]+(?:\.\d+)?)/);
      const jetpackVersion = jetpackMatch ? jetpackMatch[1] : '';

      const deviceConfig: DeviceConfig = {
        vendor,
        product,
        module,
        jetpack,
        storage,
        id,
        l4tVersion,
        jetpackVersion
      };

      devices.push(deviceConfig);
      vendors.add(vendor);
      modules.add(module);
      jetpackVersions.add(jetpack);
      storageTypes.add(storage);
    }
  });

  return {
    devices,
    vendors: Array.from(vendors).sort(),
    modules: Array.from(modules).sort(),
    jetpackVersions: Array.from(jetpackVersions).sort(),
    storageTypes: Array.from(storageTypes).sort()
  };
}

export function getDevicesByVendor(devices: DeviceConfig[]): Record<string, DeviceConfig[]> {
  return devices.reduce((acc, device) => {
    if (!acc[device.vendor]) {
      acc[device.vendor] = [];
    }
    acc[device.vendor].push(device);
    return acc;
  }, {} as Record<string, DeviceConfig[]>);
}

export function getDevicesByModule(devices: DeviceConfig[]): Record<string, DeviceConfig[]> {
  return devices.reduce((acc, device) => {
    if (!acc[device.module]) {
      acc[device.module] = [];
    }
    acc[device.module].push(device);
    return acc;
  }, {} as Record<string, DeviceConfig[]>);
}

export function getAvailableJetpackVersions(devices: DeviceConfig[], module?: string): string[] {
  let filteredDevices = devices;
  
  if (module) {
    filteredDevices = devices.filter(d => d.module === module);
  }
  
  const versions = new Set(filteredDevices.map(d => d.jetpack));
  return Array.from(versions).sort().reverse(); // Latest first
}

export function getCompatibleStorageOptions(devices: DeviceConfig[], module: string, jetpack: string): string[] {
  const compatibleDevices = devices.filter(d => 
    d.module === module && d.jetpack === jetpack
  );
  
  const storageOptions = new Set(compatibleDevices.map(d => d.storage));
  return Array.from(storageOptions).sort();
}

export function findDeviceConfig(
  devices: DeviceConfig[], 
  vendor: string, 
  module: string, 
  jetpack: string, 
  storage: string
): DeviceConfig | undefined {
  return devices.find(d => 
    d.vendor === vendor && 
    d.module === module && 
    d.jetpack === jetpack && 
    d.storage === storage
  );
}

// Convert module name to USB board ID mapping (based on known Jetson board IDs)
export function getModuleBoardId(module: string): string {
  const boardIdMap: Record<string, string> = {
    'AGX Orin': '3701-0000',
    'Orin NX': '3767-0000', 
    'Orin Nano': '3767-0003',
    'AGX Xavier': '2888-0001',
    'Xavier NX': '3668-0000',
    'Nano - 4GB': '3448-0002',
    'Nano - 2GB': '3448-0003'
  };

  return boardIdMap[module] || '0000-0000';
}

// Map storage types to technical identifiers
export function mapStorageType(storage: string): string {
  const storageMap: Record<string, string> = {
    'NVMe SSD': 'nvme',
    'Micro SD': 'sd',
    'eMMC': 'emmc',
    'USB': 'usb'
  };

  return storageMap[storage] || storage.toLowerCase();
}