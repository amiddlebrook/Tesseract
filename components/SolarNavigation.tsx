import React from 'react';
import { motion } from 'framer-motion';
import { Grid, ChevronLeft } from 'lucide-react';
import { ModuleID } from '../types';

interface ControlDialProps {
  activeModule: ModuleID | null;
  onReset: () => void;
}

export const SolarNavigation: React.FC<ControlDialProps> = ({ activeModule, onReset }) => {
  const MotionButton = motion.button as any;

  if (!activeModule) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <MotionButton
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="
                flex items-center gap-3 px-6 py-3 
                bg-ind-surface border border-ind-stroke 
                shadow-hard text-ind-text
                group
            "
        >
            <ChevronLeft size={16} className="text-ind-orange" />
            <div className="flex flex-col items-start">
                <span className="font-mono text-xs font-bold tracking-widest">RETURN TO GRID</span>
                <span className="font-mono text-[9px] text-ind-muted">SYSTEM VIEW</span>
            </div>
            
            {/* Mechanical accent */}
            <div className="ml-2 w-1 h-6 bg-ind-stroke"></div>
            <Grid size={16} className="text-ind-muted group-hover:text-ind-text transition-colors" />
        </MotionButton>
    </div>
  );
};