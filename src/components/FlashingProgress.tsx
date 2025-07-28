import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  CheckCircle, 
  Terminal, 
  XCircle, 
  Download, 
  HardDrive, 
  Shield,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { FlashProgress, FlashCommand, JetsonDevice, FlashProfile } from "../types";
import TauriService from "../services/tauriService";

interface FlashingProgressProps {
  device: JetsonDevice;
  profile: FlashProfile;
  onComplete: () => void;
  onCancel?: () => void;
}

export default function FlashingProgress({ device, profile, onComplete, onCancel }: FlashingProgressProps) {
  const [progress, setProgress] = useState<FlashProgress>({
    stage: 'preparing',
    progress: 0,
    message: 'Initializing flash process...',
    details: undefined,
    startTime: new Date(),
    estimatedTimeRemaining: undefined,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(true);
  
  const tauriService = TauriService.getInstance();
  const progressCleanupRef = useRef<(() => void) | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startFlashProcess();
    
    return () => {
      // Cleanup progress listener on unmount
      if (progressCleanupRef.current) {
        progressCleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll logs to bottom
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startFlashProcess = async () => {
    try {
      const command: FlashCommand = {
        product: device.product,
        deviceModule: device.module, 
        jetpackVersion: profile.configuration.jetpackVersion,
        storageDevice: profile.configuration.storage,
        keepFiles: profile.configuration.options.keepFiles,
        userName: 'jetson', // Default username
      };

      console.log('Starting flash process with command:', command);
      
      const id = await tauriService.startFlashProcess(command);
      setFlashId(id);
      
      // Set up progress monitoring
      const cleanup = tauriService.onFlashProgress(id, (newProgress) => {
        console.log('Progress update:', newProgress);
        setProgress(newProgress);
        
        // Add log entry for significant progress updates
        if (newProgress.message && newProgress.message !== progress.message) {
          const timestamp = new Date().toISOString().substring(11, 19);
          setLogs(prev => [...prev, `[${timestamp}] ${newProgress.message}`]);
        }
        
        // Handle stage changes
        if (newProgress.stage === 'complete') {
          setCanCancel(false);
          setTimeout(() => {
            onComplete();
          }, 3000); // Show completion for 3 seconds
        } else if (newProgress.stage === 'error') {
          setError(newProgress.details || 'Flash process failed');
          setCanCancel(false);
        }
      });
      
      progressCleanupRef.current = cleanup;
      
    } catch (err) {
      console.error('Failed to start flash process:', err);
      setError(err instanceof Error ? err.message : 'Failed to start flash process');
      setProgress(prev => ({
        ...prev,
        stage: 'error',
        message: 'Failed to start flash process',
        details: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  };

  const handleCancel = async () => {
    if (!flashId || !canCancel) return;
    
    try {
      await tauriService.cancelFlashProcess(flashId);
      setProgress(prev => ({
        ...prev,
        stage: 'error',
        message: 'Flash process cancelled',
        details: 'User cancelled the operation'
      }));
      setCanCancel(false);
      
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Failed to cancel flash process:', err);
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Retrying flash process...',
      details: undefined,
      startTime: new Date(),
      estimatedTimeRemaining: undefined,
    });
    setLogs([]);
    setCanCancel(true);
    startFlashProcess();
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return <RefreshCw className="w-8 h-8 animate-spin" />;
      case 'downloading':
        return <Download className="w-8 h-8 animate-bounce" />;
      case 'flashing':
        return <Zap className="w-8 h-8 animate-pulse" />;
      case 'verifying':
        return <Shield className="w-8 h-8" />;
      case 'complete':
        return <CheckCircle className="w-8 h-8" />;
      case 'error':
        return <XCircle className="w-8 h-8" />;
      default:
        return <HardDrive className="w-8 h-8" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'complete':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-nvidia-400';
    }
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (progress.stage === 'error') return 'from-red-500 to-red-400';
    if (progress.stage === 'complete') return 'from-green-500 to-green-400';
    return 'from-nvidia-500 to-nvidia-400';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2">
          {progress.stage === 'complete' ? 'Flash Complete!' : 
           progress.stage === 'error' ? 'Flash Failed' : 'Flashing in Progress'}
        </h2>
        <p className="text-gray-400">
          {device.vendor} {device.product} → {profile.name}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          JetPack {profile.configuration.jetpackVersion} • {profile.configuration.storage.toUpperCase()} Storage
        </p>
      </motion.div>

      {/* Progress Circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke={progress.stage === 'error' ? '#ef4444' : 
                     progress.stage === 'complete' ? '#22c55e' : '#76B900'}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress.progress / 100)}`}
              transition={{ duration: 0.5 }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={progress.stage}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mb-2 ${getStageColor(progress.stage)}`}
            >
              {getStageIcon(progress.stage)}
            </motion.div>
            <div className="text-3xl font-bold text-white">{Math.round(progress.progress)}%</div>
            <div className={`text-sm font-medium capitalize ${getStageColor(progress.stage)}`}>
              {progress.stage}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status and Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{progress.message}</h3>
          {progress.estimatedTimeRemaining && (
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                ETA: {formatTimeRemaining(progress.estimatedTimeRemaining)}
              </span>
            </div>
          )}
        </div>
        
        {progress.details && (
          <p className="text-gray-400 text-sm mb-4">{progress.details}</p>
        )}
        
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-3 bg-gradient-to-r ${getProgressColor()} rounded-full`}
            style={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Stage Indicators */}
        <div className="flex justify-between mt-4 text-xs">
          {['preparing', 'downloading', 'flashing', 'verifying', 'complete'].map((stage, index) => (
            <div
              key={stage}
              className={`flex flex-col items-center space-y-1 ${
                progress.stage === stage ? 'text-nvidia-400' : 
                ['preparing', 'downloading', 'flashing', 'verifying'].indexOf(progress.stage) > index ? 
                'text-green-400' : 'text-gray-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                progress.stage === stage ? 'bg-nvidia-400' : 
                ['preparing', 'downloading', 'flashing', 'verifying'].indexOf(progress.stage) > index ? 
                'bg-green-400' : 'bg-gray-500'
              }`} />
              <span className="capitalize">{stage}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-xl border-red-500/50 bg-red-500/10"
        >
          <div className="flex items-center space-x-2 text-red-400 mb-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Flash Process Failed</span>
          </div>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={handleRetry}
              className="btn-primary"
            >
              Retry Flash
            </button>
            <button 
              onClick={onCancel}
              className="btn-secondary"
            >
              Back to Selection
            </button>
          </div>
        </motion.div>
      )}

      {/* Success Actions */}
      {progress.stage === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-xl border-green-500/50 bg-green-500/10"
        >
          <div className="flex items-center space-x-2 text-green-400 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Flash Completed Successfully!</span>
          </div>
          <p className="text-green-300 text-sm mb-4">
            Your {device.vendor} {device.product} has been flashed with {profile.configuration.jetpackVersion}. 
            You can now disconnect the device and boot it normally.
          </p>
          <div className="flex space-x-3">
            <button 
              onClick={onComplete}
              className="btn-primary"
            >
              View Containers
            </button>
            <button 
              onClick={onCancel}
              className="btn-secondary"
            >
              Flash Another Device
            </button>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      {canCancel && progress.stage !== 'complete' && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleCancel}
            className="btn-secondary"
          >
            Cancel Flash
          </button>
        </motion.div>
      )}

      {/* Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-nvidia-400" />
            <span className="font-medium text-white">Flash Logs</span>
          </div>
          <span className="text-xs text-gray-500">{logs.length} entries</span>
        </div>
        
        <div className="bg-gray-900/50 p-4 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">Waiting for log output...</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-300">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}