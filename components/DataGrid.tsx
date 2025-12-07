import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Share2 } from 'lucide-react';

const NODES = [
    { id: 'N-01', region: 'US-EAST', lat: 24 },
    { id: 'N-02', region: 'EU-WEST', lat: 112 },
    { id: 'N-03', region: 'AP-SOUTH', lat: 85 },
    { id: 'N-04', region: 'SA-EAST', lat: 45 },
    { id: 'N-05', region: 'US-WEST', lat: 32 },
    { id: 'N-06', region: 'EU-CENT', lat: 98 },
];

export const DataGrid: React.FC = () => {
  const MotionDiv = motion.div as any;

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-mono text-lg text-ind-text uppercase border-l-4 border-ind-orange pl-3">Topology Map</h2>
            <div className="flex items-center gap-2 text-xs font-mono text-ind-muted">
                <Wifi size={14} />
                <span>SIGNAL_STRENGTH: 98%</span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-0 border border-ind-stroke">
            <div className="grid grid-cols-4 bg-ind-surface border-b border-ind-stroke py-2 px-4 font-mono text-[10px] text-ind-muted uppercase tracking-wider">
                <div>Node ID</div>
                <div>Region</div>
                <div>Latency</div>
                <div className="text-right">Status</div>
            </div>
            
            {NODES.map((node, i) => (
                <div key={node.id} className="grid grid-cols-4 py-3 px-4 border-b border-ind-stroke hover:bg-white/5 transition-colors font-mono text-xs group cursor-pointer">
                    <div className="text-ind-text font-bold group-hover:text-ind-orange transition-colors flex items-center gap-2">
                        <Share2 size={12} className="opacity-50" />
                        {node.id}
                    </div>
                    <div className="text-ind-muted">{node.region}</div>
                    <div className="text-ind-text">{node.lat}ms</div>
                    <div className="text-right flex justify-end items-center">
                        <div className={`w-2 h-2 rounded-sm ${node.lat > 100 ? 'bg-ind-orange' : 'bg-[#00FF00]'}`}></div>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-auto pt-6">
            <div className="h-32 border border-ind-stroke bg-ind-bg relative overflow-hidden p-2">
                 <div className="absolute top-2 left-2 text-[9px] font-mono text-ind-muted">PACKET_LOSS_VISUALIZATION</div>
                 <div className="h-full w-full flex items-end gap-1">
                     {Array.from({ length: 40 }).map((_, i) => (
                         <MotionDiv
                            key={i}
                            className="flex-1 bg-ind-stroke hover:bg-ind-text transition-colors"
                            initial={{ height: '10%' }}
                            animate={{ height: `${Math.random() * 80 + 10}%` }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", delay: i * 0.05 }}
                         />
                     ))}
                 </div>
            </div>
        </div>
    </div>
  );
};