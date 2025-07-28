export interface JetsonDevice {
  id: string;
  vendor: string;
  product: string;
  module: string;
  boardId: string;
  isConnected: boolean;
  supportedL4T: string[];
  storageOptions: StorageType[];
  image?: string;
}

export interface FlashConfiguration {
  device: JetsonDevice;
  jetpackVersion: string;
  storage: StorageType;
  flashMode: FlashMode;
  options: FlashOptions;
}

export interface FlashProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  configuration: FlashConfiguration;
  tags: string[];
  lastUsed?: Date;
  successRate?: number;
}

export interface FlashProgress {
  stage: FlashStage;
  progress: number;
  message: string;
  logs: string[];
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface FlashResult {
  success: boolean;
  duration: number;
  logs: string[];
  error?: string;
}

export type StorageType = "emmc" | "nvme" | "usb" | "sd";

export type FlashMode = "standard" | "initrd" | "massflash" | "external";

export type FlashStage = 
  | "preparing" 
  | "downloading" 
  | "extracting" 
  | "applying_binaries" 
  | "flashing" 
  | "verifying" 
  | "complete" 
  | "error";

export interface FlashOptions {
  keepFiles: boolean;
  customKernel?: string;
  customDTB?: string;
  secureboot?: boolean;
  odmData?: string;
  rootfsSize?: string;
}

export interface DeviceStats {
  totalFlashes: number;
  successRate: number;
  avgFlashTime: number;
  lastFlashed?: Date;
}

export interface SystemInfo {
  platform: string;
  version: string;
  hasRust: boolean;
  hasUSBAccess: boolean;
}