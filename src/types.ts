/**
 * Core type definitions for CFU - Cordatus Flash Utility
 * Updated to support real device data from CSV configuration
 */

export interface JetsonDevice {
  id: string;
  vendor: string;
  product: string;
  module: string;
  boardId: string;
  isConnected: boolean;
  supportedL4T: string[];
  storageOptions: string[];
}

export interface FlashConfiguration {
  device: JetsonDevice;
  jetpackVersion: string;
  storage: string;
  flashMode: 'standard' | 'initrd' | 'recovery';
  options: {
    keepFiles: boolean;
    secureboot: boolean;
  };
}

export interface FlashProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  configuration: FlashConfiguration;
  tags: string[];
  successRate: number;
  availableStorageOptions?: string[];
}

export interface FlashProgress {
  stage: 'preparing' | 'downloading' | 'flashing' | 'verifying' | 'complete' | 'error';
  progress: number;
  message: string;
  details?: string;
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

export interface FlashResult {
  success: boolean;
  message: string;
  details?: string;
  duration?: number;
  logs?: string[];
}

export interface SystemRequirements {
  minSpace: number; // GB
  requiredTools: string[];
  supportedOS: string[];
  pythonVersion?: string;
}

export interface USBDevice {
  vendorId: string;
  productId: string;
  devicePath: string;
  isJetson: boolean;
  detectedModule?: string;
}

export interface ApplicationSettings {
  theme: 'dark' | 'light' | 'auto';
  autoDetectDevices: boolean;
  downloadPath: string;
  keepDownloads: boolean;
  enableAnalytics: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface ModelPackage {
  id: string;
  name: string;
  category: 'computer-vision' | 'nlp' | 'robotics' | 'edge-ai';
  description: string;
  size: string;
  version: string;
  downloads: number;
  rating: number;
  supportedDevices: string[];
  requirements: string[];
  downloadUrl: string;
  documentationUrl?: string;
  isInstalled?: boolean;
  installPath?: string;
}

export interface FlashCommand {
  product: string;
  deviceModule: string;
  jetpackVersion: string;
  storageDevice: string;
  keepFiles: boolean;
  userName: string;
}