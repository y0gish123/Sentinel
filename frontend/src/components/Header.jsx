import MissionConfig from './MissionConfig';

export default function Header({ pipelineState, onSimulate, onReset, isRunning, missionKey }) {
  const isComplete = pipelineState.status === 'complete';

  return (
    <div className="h-[70px] border-b border-zinc-200 flex items-center justify-between px-10 bg-white/80 backdrop-blur-xl z-50">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-blue-600 tracking-[0.2em] leading-none mb-1">
            SENTINEL
          </h1>
          <span className="text-[9px] text-zinc-400 font-black tracking-[0.4em] uppercase">
            Agentic Response Unit
          </span>
        </div>

        <div className="h-10 w-px bg-zinc-100"></div>
        
        {/* MISSION CONFIG INTEGRATION - Uses key to force reset state */}
        <MissionConfig key={missionKey} onStart={onSimulate} isRunning={isRunning} />
      </div>

      <div className="flex items-center gap-6">
        {/* RESET BUTTON */}
        {(isRunning || isComplete) && (
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 group"
            title="Reset Mission Protocol"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0 0V3m0 5h-5m-9 7a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16m0 0v5m0-5h-5" />
            </svg>
            <span className="text-[10px] font-black tracking-widest uppercase">Reset</span>
          </button>
        )}

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : (isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300')}`}></div>
          <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
            {isComplete ? 'Mission Complete' : (isRunning ? 'System Active' : 'Uplink Standby')}
          </span>
        </div>
      </div>
    </div>
  );
}
