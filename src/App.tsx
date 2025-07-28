import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Settings, Monitor, Package } from "lucide-react";
import { Toaster } from "react-hot-toast";
import DeviceSelection from "./components/DeviceSelection";
import SetupWizard from "./components/SetupWizard";
import FlashingProgress from "./components/FlashingProgress";
import Models from "./components/Models";
import SettingsPanel from "./components/SettingsPanel";
import CommandPalette from "./components/CommandPalette";
import { JetsonDevice, FlashProfile } from "./types";

type ViewType = "devices" | "setup" | "flashing" | "models" | "settings";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("devices");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<JetsonDevice | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FlashProfile | null>(null);

  const views = [
    { id: "devices", icon: Monitor, label: "Devices" },
    { id: "flashing", icon: Zap, label: "Flash" },
    { id: "models", icon: Package, label: "Models" },
    { id: "settings", icon: Settings, label: "Settings" },
  ] as const;

  const handleDeviceFlashStart = (device: JetsonDevice, profile: FlashProfile) => {
    setSelectedDevice(device);
    setSelectedProfile(profile);
    setCurrentView("setup");
  };

  const handleSetupComplete = () => {
    setCurrentView("flashing");
  };

  const handleFlashComplete = () => {
    setCurrentView("models");
  };

  const handleCancel = () => {
    setSelectedDevice(null);
    setSelectedProfile(null);
    setCurrentView("devices");
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "devices":
        return (
          <DeviceSelection 
            onFlashStart={handleDeviceFlashStart}
            selectedDevice={selectedDevice}
            selectedProfile={selectedProfile}
          />
        );
      case "setup":
        return selectedDevice && selectedProfile ? (
          <SetupWizard 
            device={selectedDevice}
            profile={selectedProfile}
            onStartFlash={handleSetupComplete}
            onCancel={handleCancel}
          />
        ) : (
          <DeviceSelection onFlashStart={handleDeviceFlashStart} />
        );
      case "flashing":
        return selectedDevice && selectedProfile ? (
          <FlashingProgress 
            device={selectedDevice}
            profile={selectedProfile}
            onComplete={handleFlashComplete}
            onCancel={handleCancel}
          />
        ) : (
          <DeviceSelection onFlashStart={handleDeviceFlashStart} />
        );
      case "models":
        return <Models />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <DeviceSelection onFlashStart={handleDeviceFlashStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-white/10 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-nvidia-500 to-nvidia-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CFU - Cordatus Flash Utility</h1>
              <p className="text-sm text-gray-400">Developed by Cordatus.ai</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {views.map(({ id, icon: Icon, label }) => {
              // Hide setup view from navigation (it's accessed through devices)
              if (id === 'setup') return null;
              
              const isDisabled = (id === 'flashing' && (!selectedDevice || !selectedProfile)) ||
                               (currentView === 'setup' && id !== 'devices');
              
              return (
                <motion.button
                  key={id}
                  onClick={() => {
                    if (!isDisabled) {
                      if (id === 'devices') {
                        handleCancel(); // Reset selection when going back to devices
                      }
                      setCurrentView(id as ViewType);
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentView === id
                      ? "bg-nvidia-500/20 text-nvidia-400 border border-nvidia-500/30"
                      : isDisabled
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="p-6">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentView()}
        </motion.div>
      </main>

      {/* Status Bar */}
      {(selectedDevice || selectedProfile) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 glass p-3 rounded-lg max-w-sm"
        >
          <div className="text-xs text-gray-400">
            {selectedDevice && (
              <div>Device: {selectedDevice.vendor} {selectedDevice.product}</div>
            )}
            {selectedProfile && (
              <div>Profile: {selectedProfile.name}</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "glass text-white border-white/20",
          style: {
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(12px)",
          },
        }}
      />

      {/* Global Keyboard Shortcuts */}
      <div
        className="fixed inset-0 pointer-events-none"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setIsCommandPaletteOpen(true);
          }
        }}
        tabIndex={-1}
      />
    </div>
  );
}

export default App;