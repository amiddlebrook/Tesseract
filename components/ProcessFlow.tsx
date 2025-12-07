import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Box, CheckCircle } from 'lucide-react';

export const ProcessFlow: React.FC = () => {
    const MotionDiv = motion.div as any;
    
    const steps = [
        { id: '01', label: 'INPUT_STREAM', status: 'complete' },
        { id: '02', label: 'NORMALIZE', status: 'complete' },
        { id: '03', label: 'INFERENCE_ENGINE', status: 'active' },
        { id: '04', label: 'OUTPUT_BUFFER', status: 'pending' },
    ];
  
    return (
      <div className="h-full flex flex-col justify-center">
          <div className="flex flex-col gap-4">
              {steps.map((step, i) => (
                  <div key={step.id} className="relative flex items-center gap-4">
                      {/* Connector Line */}
                      {i !== steps.length - 1 && (
                          <div className="absolute left-6 top-10 bottom-[-20px] w-[2px] bg-ind-stroke z-0"></div>
                      )}

                      {/* Icon */}
                      <div className={`
                          w-12 h-12 border-2 z-10 flex items-center justify-center bg-ind-panel
                          ${step.status === 'active' ? 'border-ind-orange text-ind-orange' : 
                            step.status === 'complete' ? 'border-ind-text text-ind-text' : 'border-ind-stroke text-ind-muted'}
                      `}>
                          {step.status === 'complete' ? <CheckCircle size={20} /> : <Box size={20} />}
                      </div>

                      {/* Card */}
                      <div className={`
                          flex-1 p-4 border flex justify-between items-center
                          ${step.status === 'active' ? 'bg-ind-surface border-ind-orange shadow-[4px_4px_0px_#FF3B00]' : 
                            'bg-ind-bg border-ind-stroke'}
                      `}>
                          <div>
                              <div className={`text-[10px] font-mono font-bold ${step.status === 'active' ? 'text-ind-orange' : 'text-ind-muted'}`}>STEP_{step.id}</div>
                              <div className="font-mono text-sm font-medium">{step.label}</div>
                          </div>
                          
                          {step.status === 'active' && (
                              <MotionDiv 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-ind-orange border-t-transparent rounded-full"
                              />
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    );
  };