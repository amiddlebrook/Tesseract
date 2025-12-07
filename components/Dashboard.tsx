import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const MotionDiv = motion.div as any;

    return (
        <div className="h-full flex flex-col gap-8">
            {/* Large Status Display */}
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 border border-ind-stroke bg-ind-bg flex items-center justify-center relative">
                    <Activity size={40} className="text-ind-orange" />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-ind-orange animate-pulse"></div>
                </div>
                <div>
                    <h1 className="text-4xl font-mono font-bold text-ind-text tracking-tighter">SYSTEM_OK</h1>
                    <p className="font-mono text-sm text-ind-muted mt-1">ALL SUBSYSTEMS NOMINAL</p>
                </div>
            </div>

            {/* Hardware Stats Grid */}
            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="border border-ind-stroke p-4 bg-ind-bg flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <Cpu size={20} className="text-ind-muted" />
                        <span className="font-mono text-xs text-ind-text">CPU_01</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-mono text-ind-text">12<span className="text-sm text-ind-muted">%</span></div>
                        <div className="w-full bg-ind-surface h-1 mt-2">
                            <div className="bg-ind-text h-full w-[12%]"></div>
                        </div>
                    </div>
                </div>

                <div className="border border-ind-stroke p-4 bg-ind-bg flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <HardDrive size={20} className="text-ind-muted" />
                        <span className="font-mono text-xs text-ind-text">MEM_ALLOC</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-mono text-ind-text">4.2<span className="text-sm text-ind-muted">GB</span></div>
                        <div className="w-full bg-ind-surface h-1 mt-2">
                            <div className="bg-ind-text h-full w-[45%]"></div>
                        </div>
                    </div>
                </div>

                {/* Console Output */}
                <div className="col-span-2 border border-ind-stroke p-4 bg-[#0a0a0a] font-mono text-xs text-ind-muted h-32 overflow-hidden relative">
                    <div className="absolute top-2 right-2 px-1 bg-ind-orange text-[#000] font-bold text-[9px]">LIVE_LOG</div>
                    <div className="flex flex-col gap-1 opacity-80">
                        <span>&gt; INIT_SEQUENCE_START</span>
                        <span>&gt; CHECKING_PERIPHERALS... OK</span>
                        <span>&gt; LOADING_KERNEL_MODULES [X86]... OK</span>
                        <span>&gt; MOUNTING_FS... OK</span>
                        <span className="text-ind-orange">&gt; WARN: LATENCY DETECTED ON PORT_8080</span>
                    </div>
                </div>
            </div>
        </div>
    );
};