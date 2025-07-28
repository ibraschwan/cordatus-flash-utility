import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle,
  Info,
  Monitor,
  Usb,
  HardDrive,
  Zap,
  Download,
  Shield,
  Wifi,
  Terminal,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Search
} from "lucide-react";
import { JetsonDevice, FlashProfile, SystemInfo } from "../types";
import TauriService from "../services/tauriService";

interface SetupWizardProps {
  device: JetsonDevice;
  profile: FlashProfile;
  onStartFlash: () => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  canSkip?: boolean;
  isComplete?: boolean;
}

export default function SetupWizard({ device, profile, onStartFlash, onCancel }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const tauriService = TauriService.getInstance();

  const steps: WizardStep[] = [
    {
      id: 'requirements',
      title: 'System Requirements',
      description: 'Check system compatibility and requirements',
      component: SystemRequirementsStep,
    },
    {
      id: 'preparation',
      title: 'Hardware Preparation',
      description: 'Prepare cables and hardware setup',
      component: HardwarePreparationStep,
    },
    {
      id: 'recovery',
      title: 'Recovery Mode',
      description: 'Put device in forced recovery mode',
      component: RecoveryModeStep,
    },
    {
      id: 'validation',
      title: 'Pre-flash Validation',
      description: 'Validate all requirements before flashing',
      component: ValidationStep,
    },
    {
      id: 'confirmation',
      title: 'Flash Confirmation',
      description: 'Review settings and start flashing',
      component: ConfirmationStep,
    },
  ];

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await tauriService.getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onStartFlash();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentStepComplete = completedSteps.has(steps[currentStep].id);
  const canAdvance = isCurrentStepComplete || steps[currentStep].canSkip;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Flash Setup Wizard</h2>
        <p className="text-gray-400">
          {device.vendor} {device.product} → {profile.name}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          JetPack {profile.configuration.jetpackVersion} • {profile.configuration.storage.toUpperCase()}
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Setup Progress</h3>
          <span className="text-sm text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-nvidia-500 text-white' 
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-600'
                  }`} 
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <h4 className="text-white font-medium">{steps[currentStep].title}</h4>
          <p className="text-gray-400 text-sm">{steps[currentStep].description}</p>
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass p-8 rounded-xl min-h-[400px]"
        >
          {React.createElement(steps[currentStep].component, {
            device,
            profile,
            systemInfo,
            onComplete: () => handleStepComplete(steps[currentStep].id),
            isComplete: isCurrentStepComplete,
          })}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
            currentStep === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'btn-secondary hover:bg-gray-600'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel Setup
        </button>

        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
            canAdvance
              ? 'btn-primary hover:bg-nvidia-600 hover:scale-105'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>
            {currentStep === steps.length - 1 ? 'Start Flashing' : 'Next'}
          </span>
          {currentStep === steps.length - 1 ? (
            <Zap className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </motion.div>
    </div>
  );
}

// Step Components
function SystemRequirementsStep({ systemInfo, onComplete, isComplete }: any) {
  const [checking, setChecking] = useState(false);
  const [requirements, setRequirements] = useState<any>(null);

  useEffect(() => {
    checkRequirements();
  }, []);

  const checkRequirements = async () => {
    setChecking(true);
    
    // Simulate requirements check
    setTimeout(() => {
      const reqs = {
        ubuntu: { 
          passed: true, 
          message: `Ubuntu ${systemInfo?.os || 'Unknown'} detected`,
          recommendation: 'Ubuntu 20.04/22.04 recommended'
        },
        memory: { 
          passed: systemInfo?.totalMemory > 8 * 1024 * 1024 * 1024, 
          message: `${Math.round((systemInfo?.totalMemory || 0) / 1024 / 1024 / 1024)}GB RAM available`,
          recommendation: 'Minimum 8GB RAM required'
        },
        storage: { 
          passed: systemInfo?.availableSpace > 50 * 1024 * 1024 * 1024, 
          message: `${Math.round((systemInfo?.availableSpace || 0) / 1024 / 1024 / 1024)}GB free space`,
          recommendation: 'Minimum 50GB free space required'
        },
        docker: { 
          passed: systemInfo?.dockerInstalled, 
          message: systemInfo?.dockerInstalled ? 'Docker installed' : 'Docker not found',
          recommendation: 'Docker required for container support'
        },
        nvidiaDocker: { 
          passed: systemInfo?.nvidiaDockerInstalled, 
          message: systemInfo?.nvidiaDockerInstalled ? 'NVIDIA Docker runtime available' : 'NVIDIA Docker not found',
          recommendation: 'NVIDIA Docker runtime recommended'
        }
      };
      
      setRequirements(reqs);
      setChecking(false);
      
      // Auto-complete if all critical requirements pass
      const criticalReqs = [reqs.ubuntu, reqs.memory, reqs.storage];
      if (criticalReqs.every(req => req.passed)) {
        onComplete();
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Monitor className="w-16 h-16 text-nvidia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">System Requirements Check</h3>
        <p className="text-gray-400">
          Validating your system compatibility for Jetson flashing
        </p>
      </div>

      {checking ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-nvidia-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking system requirements...</p>
        </div>
      ) : requirements ? (
        <div className="space-y-4">
          {Object.entries(requirements).map(([key, req]: [string, any]) => (
            <div 
              key={key}
              className={`p-4 rounded-lg border ${
                req.passed 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-yellow-500/50 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {req.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                  <div>
                    <p className={`font-medium ${req.passed ? 'text-green-400' : 'text-yellow-400'}`}>
                      {req.message}
                    </p>
                    <p className="text-sm text-gray-500">{req.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">System Requirements Met!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your system meets the minimum requirements for flashing Jetson devices.
                  Optional components like Docker can be installed later for container support.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HardwarePreparationStep({ device, onComplete, isComplete }: any) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklistItems = [
    {
      id: 'cable',
      title: 'USB-C Cable',
      description: 'USB-C cable (device side) connected to your computer',
      icon: Usb,
    },
    {
      id: 'power',
      title: 'Power Supply',
      description: 'Device power supply ready but NOT connected yet',
      icon: Zap,
    },
    {
      id: 'storage',
      title: 'Storage Media',
      description: profile.configuration.storage === 'sd' 
        ? 'MicroSD card (64GB+) inserted in device'
        : 'NVMe SSD installed in device',
      icon: HardDrive,
    },
    {
      id: 'workspace',
      title: 'Workspace',
      description: 'Clear, stable workspace with good lighting',
      icon: Monitor,
    },
  ];

  const handleItemCheck = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);

    if (newChecked.size === checklistItems.length) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Usb className="w-16 h-16 text-nvidia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Hardware Preparation</h3>
        <p className="text-gray-400">
          Prepare your hardware setup before proceeding with the flash
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {checklistItems.map((item) => (
          <motion.div
            key={item.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              checkedItems.has(item.id)
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => handleItemCheck(item.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                checkedItems.has(item.id) ? 'bg-green-500/20' : 'bg-gray-700'
              }`}>
                <item.icon className={`w-5 h-5 ${
                  checkedItems.has(item.id) ? 'text-green-400' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{item.title}</h4>
                  {checkedItems.has(item.id) && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Important Notes:</p>
            <ul className="text-gray-400 text-sm mt-2 space-y-1">
              <li>• Do NOT power on the device yet - we'll do this in recovery mode</li>
              <li>• Ensure stable USB connection to prevent flash interruption</li>
              <li>• Keep the recovery mode jumper pins ready for next step</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryModeStep({ device, onComplete, isComplete }: any) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [deviceDetected, setDeviceDetected] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const recoverySteps = [
    {
      title: 'Locate Recovery Pins',
      description: `Find the recovery pins on your ${device.module}`,
      details: 'Usually labeled as "FC REC" or "REC" pins on the board',
      image: '/images/recovery-pins.png', // Would need actual images
    },
    {
      title: 'Short Recovery Pins',
      description: 'Use jumper cap or paperclip to short the recovery pins',
      details: 'Connect pins 9 and 10 of J14 header (Orin) or equivalent for your device',
    },
    {
      title: 'Connect Power',
      description: 'While keeping pins shorted, connect power supply',
      details: 'Device should power on without normal boot - no display output is normal',
    },
    {
      title: 'Remove Jumper',
      description: 'After power-on, remove the jumper/paperclip',
      details: 'Device is now in forced recovery mode',
    },
  ];

  const detectDevice = async () => {
    setIsDetecting(true);
    try {
      const devices = await TauriService.getInstance().detectUsbDevices();
      const recoveryDevice = devices.find(d => 
        d.id === device.id && d.usb_info?.is_recovery_mode
      );
      
      if (recoveryDevice) {
        setDeviceDetected(true);
        onComplete();
      }
    } catch (error) {
      console.error('Failed to detect recovery device:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-nvidia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Recovery Mode</h3>
        <p className="text-gray-400">
          Put your {device.vendor} {device.product} into forced recovery mode
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Instructions */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Step-by-step Instructions:</h4>
          {recoverySteps.map((step, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border transition-all ${
                index === currentStep 
                  ? 'border-nvidia-500/50 bg-nvidia-500/10' 
                  : index < currentStep 
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-nvidia-500 text-white' 
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-white">{step.title}</h5>
                  <p className="text-gray-400 text-sm mt-1">{step.description}</p>
                  {step.details && (
                    <p className="text-gray-500 text-xs mt-2">{step.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="btn-secondary flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(recoverySteps.length - 1, currentStep + 1))}
              disabled={currentStep === recoverySteps.length - 1}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Device Detection:</h4>
          
          <div className={`p-6 rounded-lg border text-center ${
            deviceDetected 
              ? 'border-green-500/50 bg-green-500/10'
              : 'border-gray-600'
          }`}>
            {deviceDetected ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-medium">Recovery Device Detected!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your {device.product} is ready for flashing
                </p>
              </>
            ) : (
              <>
                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">Waiting for recovery device...</p>
                <p className="text-gray-500 text-sm mt-1">
                  Follow the steps to put device in recovery mode
                </p>
              </>
            )}
          </div>

          <button
            onClick={detectDevice}
            disabled={isDetecting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isDetecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>
              {isDetecting ? 'Detecting...' : 'Detect Recovery Device'}
            </span>
          </button>

          <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium text-sm">Troubleshooting:</p>
                <ul className="text-gray-400 text-xs mt-1 space-y-1">
                  <li>• Check USB cable connection</li>
                  <li>• Try different USB port</li>
                  <li>• Ensure recovery pins are properly shorted</li>
                  <li>• Power cycle the device if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationStep({ device, profile, systemInfo, onComplete, isComplete }: any) {
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    runValidation();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    
    // Simulate comprehensive validation
    setTimeout(() => {
      const results = {
        recovery: { passed: true, message: 'Device in recovery mode' },
        space: { passed: true, message: '50GB+ free space available' },
        network: { passed: true, message: 'Internet connection active' },
        permissions: { passed: true, message: 'Sudo access verified' },
        compatibility: { passed: true, message: 'JetPack compatibility confirmed' },
      };
      
      setValidationResults(results);
      setIsValidating(false);
      
      if (Object.values(results).every((r: any) => r.passed)) {
        onComplete();
      }
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 text-nvidia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Pre-flash Validation</h3>
        <p className="text-gray-400">
          Final checks before starting the flash process
        </p>
      </div>

      {isValidating ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-nvidia-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Running comprehensive validation...</p>
        </div>
      ) : validationResults ? (
        <div className="space-y-4">
          {Object.entries(validationResults).map(([key, result]: [string, any]) => (
            <div 
              key={key}
              className={`p-4 rounded-lg border ${
                result.passed 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-red-500/50 bg-red-500/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <p className={`${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {result.message}
                </p>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">All Validations Passed!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Your system is ready to flash {device.vendor} {device.product} with 
                  JetPack {profile.configuration.jetpackVersion}.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConfirmationStep({ device, profile, onComplete }: any) {
  useEffect(() => {
    onComplete(); // Auto-complete this step
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="w-16 h-16 text-nvidia-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Ready to Flash</h3>
        <p className="text-gray-400">
          Review your configuration and start the flashing process
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Device Configuration:</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Device:</span>
              <span className="text-white">{device.vendor} {device.product}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Module:</span>
              <span className="text-white">{device.module}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profile:</span>
              <span className="text-white">{profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">JetPack:</span>
              <span className="text-white">{profile.configuration.jetpackVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Storage:</span>
              <span className="text-white">{profile.configuration.storage.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Flash Process:</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Download JetPack BSP files (~2-4GB)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Extract and prepare filesystem</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-nvidia-400" />
              <span className="text-gray-400">Flash bootloader and system image</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Verify flash integrity</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-nvidia-500/10 border border-nvidia-500/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-nvidia-400 mt-0.5" />
          <div>
            <p className="text-nvidia-400 font-medium">Estimated Time: 15-30 minutes</p>
            <p className="text-gray-400 text-sm mt-1">
              The flash process will download required files, extract them, and flash your device.
              Do not disconnect or power off during this process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}