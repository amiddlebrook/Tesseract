import React from 'react';
import { motion } from 'framer-motion';
import { ModuleID } from '../../types';

interface ModuleFrameProps {
  id: ModuleID;
  title: string;
  code: string;
  isExpanded: boolean;
  isActive: boolean; // Is this one expanded?
  onExpand: (id: ModuleID) => void;
  children: React.ReactNode;
}

export const ModuleFrame: React.FC<ModuleFrameProps> = ({ 
  id, 
  title, 
  code, 
  isExpanded, 
  isActive, 
  onExpand, 
  children 
}) => {
  const MotionDiv = motion.div as any;
  const MotionButton = motion.button as any;

  // Animation variants
  const variants = {
    grid: { 
      borderRadius: '0px',
      scale: 1,
      opacity: 1
    },
    hidden: { 
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    expanded: { 
      borderRadius: '0px',
      scale: 1,
      opacity: 1
    }
  };

  // Determine state
  let state = 'grid';
  if (isExpanded) {
    state = isActive ? 'expanded' : 'hidden';
  }

  return (
    <MotionDiv
      layoutId={`card-${id}`}
      variants={variants}
      initial="grid"
      animate={state}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        bg-ind-surface border border-ind-stroke relative flex flex-col overflow-hidden
        ${!isExpanded ? 'hover:border-ind-orange cursor-pointer group' : ''}
        ${isActive ? 'z-40' : 'z-10'}
        ${isExpanded && !isActive ? 'pointer-events-none' : ''}
      `}
      onClick={() => !isExpanded && onExpand(id)}
    >
      {/* Mechanical Header */}
      <div className="h-12 bg-ind-bg border-b border-ind-stroke flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-ind-orange shadow-[0_0_5px_rgba(255,59,0,0.5)]"></span>
              <span className="font-mono text-xs font-bold tracking-widest text-ind-text">{title}</span>
          </div>
          <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-ind-muted">{code}</span>
              <div className="flex gap-1">
                  <div className="screw"></div>
                  <div className="screw"></div>
              </div>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-auto custom-scrollbar bg-ind-panel">
         {/* Internal Grid Pattern */}
         <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none"></div>
         
         <div className="relative z-10 p-6 h-full">
            {children}
         </div>
      </div>

      {/* Footer/Status Bar */}
      <div className="h-8 bg-ind-bg border-t border-ind-stroke flex items-center justify-between px-4">
          <div className="text-[9px] font-mono text-ind-muted uppercase">Status: <span className="text-ind-text">Online</span></div>
          {!isExpanded && (
             <div className="text-[9px] font-mono text-ind-orange opacity-0 group-hover:opacity-100 transition-opacity">
                 [CLICK TO EXPAND]
             </div>
          )}
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ind-stroke pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ind-stroke pointer-events-none"></div>
    </MotionDiv>
  );
};