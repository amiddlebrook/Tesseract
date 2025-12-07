import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DATA = Array.from({ length: 20 }).map((_, i) => ({
    time: i,
    val1: Math.random() * 40 + 30,
    val2: Math.random() * 20 + 10
}));

export const ControlPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-ind-stroke bg-ind-bg p-3">
                <div className="text-[10px] font-mono text-ind-muted uppercase">Peak Throughput</div>
                <div className="text-2xl font-mono text-ind-text">84.2<span className="text-sm">MB/s</span></div>
            </div>
            <div className="border border-ind-stroke bg-ind-bg p-3">
                <div className="text-[10px] font-mono text-ind-muted uppercase">Error Rate</div>
                <div className="text-2xl font-mono text-ind-orange">0.04<span className="text-sm">%</span></div>
            </div>
        </div>

        <div className="flex-1 border border-ind-stroke bg-ind-bg p-4 relative">
             <div className="absolute top-0 left-0 px-2 py-1 bg-ind-stroke text-[9px] font-mono text-ind-text">
                 REALTIME_TELEMETRY
             </div>
             <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={DATA}>
                     <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="time" hide />
                     <YAxis hide domain={[0, 100]} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '0px' }}
                        itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                     />
                     <Line type="stepAfter" dataKey="val1" stroke="#E0E0E0" strokeWidth={2} dot={false} />
                     <Line type="monotone" dataKey="val2" stroke="#FF3B00" strokeWidth={2} dot={false} />
                 </LineChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
};