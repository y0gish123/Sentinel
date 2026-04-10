import React from 'react';

const AGENTS = [
  { id: 'detection', num: '01', name: 'DETECTION', color: '#60A5FA' },
  { id: 'triage', num: '02', name: 'TRIAGE', color: '#F59E0B' },
  { id: 'resource', num: '03', name: 'RESOURCE', color: '#A78BFA' },
  { id: 'allocation', num: '04', name: 'ALLOCATION', color: '#EF4444' }
];

export default function PipelineNavigator({ activeAgent, completedAgents, onSelectAgent }) {
  return (
    <div className="flex items-center justify-between px-8 bg-white border-b border-zinc-100 h-[70px] z-30">
      {AGENTS.map((agent, i) => {
        const isActive = activeAgent === agent.id;
        const isComplete = completedAgents.includes(agent.id);
        const isProcessing = isActive && !isComplete;

        return (
          <React.Fragment key={agent.id}>
            <div 
              onClick={() => onSelectAgent && onSelectAgent(agent.id)}
              className={`flex items-center gap-4 px-6 h-full transition-all relative cursor-pointer group ${isActive ? 'bg-zinc-50/50' : 'opacity-60 hover:opacity-100 hover:bg-zinc-50'}`}
            >
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all relative ${isComplete ? 'bg-emerald-50 border-emerald-500' : 'bg-white'}`}
                style={{ 
                  borderColor: isActive || isComplete ? agent.color : '#E2E8F0',
                }}
              >
                {isComplete ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-[11px] font-black" style={{ color: isActive ? agent.color : '#94A3B8' }}>{agent.num}</span>
                )}
                
                {isActive && (
                  <div className="absolute -inset-1 border-2 border-dashed rounded-full animate-spin-slow" style={{ borderColor: agent.color }}></div>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className={`text-[10px] font-black tracking-widest leading-none mb-1 ${isActive ? '' : 'text-zinc-500'}`} style={{ color: isActive ? agent.color : undefined }}>
                  {agent.name}
                </span>
                <span className="text-[8px] font-bold tracking-tight uppercase text-zinc-400">
                  {isComplete ? 'VERIFIED' : (isActive ? 'PROCESSING' : 'QUEUE')}
                </span>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: agent.color }}></div>
              )}
            </div>

            {i < AGENTS.length - 1 && (
              <div className="flex-1 flex justify-center items-center px-2">
                <div className="relative w-full h-[2px] bg-zinc-100 rounded-full overflow-hidden">
                  {(activeAgent === agent.id || completedAgents.includes(agent.id)) && (
                     <div className="absolute inset-x-0 h-full animate-flow rounded-full" style={{ 
                       background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                       width: '100%',
                       animation: 'flow 2s linear infinite'
                     }}></div>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
      
      <style>{`
        @keyframes flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
