import React, { useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'framer-motion';
import { ModuleID } from './types';
import { ModuleFrame } from './components/ui/Card';
import { Dashboard } from './components/Dashboard'; // System
import { DataGrid } from './components/DataGrid'; // Network
import { ProcessFlow } from './components/ProcessFlow'; // Logic
import { ControlPanel } from './components/ControlPanel'; // Metrics
import { SolarNavigation } from './components/SolarNavigation'; // Dial

const App: React.FC = () => {
  const [expandedModule, setExpandedModule] = useState<ModuleID | null>(null);

  // Configuration for the 4 modules
  const modules = [
    { id: ModuleID.SYSTEM, title: 'SYSTEM STATUS', code: 'SYS-01', Component: Dashboard },
    { id: ModuleID.NETWORK, title: 'NETWORK TOPOLOGY', code: 'NET-04', Component: DataGrid },
    { id: ModuleID.LOGIC, title: 'LOGIC PIPELINE', code: 'LGC-99', Component: ProcessFlow },
    { id: ModuleID.METRICS, title: 'METRICS & ANALYTICS', code: 'MTR-X2', Component: ControlPanel },
  ];

  const handleReset = () => setExpandedModule(null);

  return (
    <div className="h-screen w-screen bg-ind-bg p-4 md:p-8 overflow-hidden relative">
      {/* Background Texture */}
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none"></div>
      
      {/* Header Info - Only visible on desktop or when expanded */}
      <div className="absolute top-8 left-8 hidden md:block pointer-events-none z-0">
          <h1 className="text-xl font-bold font-mono tracking-tighter text-ind-text">TESSERACT<span className="text-ind-orange">.OS</span></h1>
          <p className="text-[10px] font-mono text-ind-muted mt-1">GRID ARCHITECTURE v4.0</p>
      </div>

      <LayoutGroup>
        <div className={`
          w-full h-full max-w-[1600px] mx-auto
          transition-all duration-500
          ${expandedModule ? 'block' : 'grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4'}
        `}>
           {modules.map((mod) => (
             <ModuleFrame
                key={mod.id}
                id={mod.id}
                title={mod.title}
                code={mod.code}
                isExpanded={!!expandedModule}
                isActive={expandedModule === mod.id}
                onExpand={setExpandedModule}
             >
               <mod.Component />
             </ModuleFrame>
           ))}
        </div>
      </LayoutGroup>

      {/* Control Dial (Back Button) */}
      <AnimatePresence>
         {expandedModule && <SolarNavigation activeModule={expandedModule} onReset={handleReset} />}
      </AnimatePresence>
    </div>
  );
};

export default App;