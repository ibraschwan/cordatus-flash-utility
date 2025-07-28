import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Monitor, Bell, Cloud, Shield, HardDrive } from "lucide-react";

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState("general");

  const sections = [
    { id: "general", title: "General", icon: Settings, description: "Basic application settings" },
    { id: "display", title: "Display", icon: Monitor, description: "UI and appearance settings" },
    { id: "notifications", title: "Notifications", icon: Bell, description: "Alert preferences" },
    { id: "cloud", title: "Cloud Sync", icon: Cloud, description: "Sync profiles and settings" },
    { id: "security", title: "Security", icon: Shield, description: "Security and authentication" },
    { id: "storage", title: "Storage", icon: HardDrive, description: "File storage and cleanup" }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Customize your JetsonFlash Pro experience</p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                activeSection === section.id
                  ? "glass bg-nvidia-500/20 border-nvidia-500/50"
                  : "glass glass-hover"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-3">
                <section.icon className={`w-5 h-5 ${
                  activeSection === section.id ? "text-nvidia-400" : "text-gray-400"
                }`} />
                <div>
                  <h3 className="text-white font-medium">{section.title}</h3>
                  <p className="text-gray-400 text-sm">{section.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Settings Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-6">
              {sections.find(s => s.id === activeSection)?.title}
            </h3>
            
            {activeSection === "general" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Auto-check for updates</h4>
                    <p className="text-gray-400 text-sm">Automatically check for BSP and tool updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nvidia-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Keep flash logs</h4>
                    <p className="text-gray-400 text-sm">Preserve logs for debugging and analysis</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nvidia-500"></div>
                  </label>
                </div>
              </div>
            )}

            {activeSection !== "general" && (
              <div className="text-center py-12">
                <div className="w-16 h-16 text-gray-600 mx-auto mb-4">
                  {/* Icon placeholder */}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
                <p className="text-gray-400">This feature is under development</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Save Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center space-x-4 mt-8"
      >
        <button className="btn-secondary">Reset to Defaults</button>
        <button className="btn-primary">Save Settings</button>
      </motion.div>
    </div>
  );
}