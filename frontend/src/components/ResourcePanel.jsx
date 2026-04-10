import React, { useState } from 'react';

export default function ResourcePanel({ detection, triage, isRunning }) {
  const [showAlts, setShowAlts] = useState(false);
  const selectedHospital = detection?.selected_hospital;
  const alternatives = (detection?.alternatives || []).slice(0, 3);
  const reasoning = detection?.resource_reasoning;

  if (!selectedHospital) {
    return (
      <div className='glass-panel rounded-2xl h-full flex flex-col items-center justify-center p-8 opacity-40 group animate-fade-slide-up'>
        <div className='w-16 h-16 rounded-full border-2 border-[#84adff]/20 border-t-[#84adff] animate-spin mb-6' />
        <span className='text-[10px] font-black uppercase tracking-[0.4em] text-[#84adff] font-tactical group-hover:text-white transition-colors animate-pulse'>
          Synthesizing Tactical Data...
        </span>
      </div>
    );
  }

  return (
    <div className='h-full relative flex items-center justify-center pointer-events-auto'>
      {/* Central Decision Card */}
      <div className='glass-panel rounded-2xl p-10 w-full max-w-xl border border-[#84adff]/30 shadow-[0_0_80px_rgba(132,173,255,0.15)] animate-fade-slide-up relative z-20 hud-bracket-tl'>
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 bg-[#84adff] text-[#070d1f] text-[10px] font-black px-6 py-2 rounded-full shadow-lg uppercase tracking-[0.3em] font-tactical'>
          Optimal Route Confirmed
        </div>

        <div className='text-center mb-8'>
          <h2 className='text-4xl font-black text-white tracking-tighter mb-3 font-tactical uppercase'>{selectedHospital}</h2>
          <div className='flex items-center justify-center gap-6'>
             <span className='text-[#84adff] font-mono text-xs font-bold uppercase tracking-widest'>{detection.hospital_specialty || 'Critical Care'}</span>
             <span className='w-1 h-1 bg-white/20 rounded-full'></span>
             <span className='text-gray-500 text-[10px] uppercase font-black tracking-widest font-tactical'>Tactical Level 1 Facility</span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-6 mb-10'>
           <div className='bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col items-center group hover:bg-white/10 transition-all'>
              <span className='text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-2 font-tactical'>Intercept ETA</span>
              <div className='text-4xl font-black text-[#84adff] font-mono tracking-tighter'>
                {detection.eta_minutes}<span className='text-xs font-normal opacity-40 ml-1'>MIN</span>
              </div>
           </div>
            <div className='bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col items-center group hover:bg-white/10 transition-all'>
               <span className='text-[10px] font-black text-blue-400/60 uppercase tracking-widest mb-2 font-tactical'>Decision Confidence</span>
               <div className='text-4xl font-black text-white font-mono tracking-tighter'>
                 {( (detection.confidence_score || 0.95) * 100).toFixed(0)}<span className='text-xs font-normal opacity-40 ml-1'>%</span>
               </div>
            </div>
        </div>

        <div className='bg-[#0c1326]/60 p-8 rounded-2xl border border-white/5 mb-10'>
           <div className='text-[10px] font-black text-blue-400/60 uppercase tracking-[0.3em] mb-4 font-tactical'>Strategic Justification</div>
           <div className='space-y-4'>
             {reasoning?.split('\n').map((line, i) => (
                <div key={i} className='text-xs leading-relaxed text-[#dfe4fe] flex gap-3'>
                  {line.startsWith('*') ? (
                    <>
                      <span className='text-[#84adff] flex-none font-bold'>//</span>
                      <span className='tracking-tight'>{line.replace(/^\*\s*/, '')}</span>
                    </>
                  ) : (
                    <span className='opacity-80 italic'>{line}</span>
                  )}
                </div>
             ))}
           </div>
        </div>

        <button 
          onClick={() => setShowAlts(!showAlts)}
          className='w-full py-5 bg-[#84adff]/5 hover:bg-[#84adff]/15 border border-[#84adff]/20 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] transition-all font-tactical text-[#84adff] hover:text-white group'
        >
          {showAlts ? 'Close Comparison' : 'Analyze Tier 2 Options'}
        </button>
      </div>

      {/* Satellite Alternatives (appearing below/around) */}
      {showAlts && (
        <div className='absolute inset-0 z-30 bg-[#070d1f]/95 backdrop-blur-2xl rounded-3xl p-10 flex flex-col animate-fade-slide-up border border-white/10'>
           <div className='flex justify-between items-center mb-8 border-b border-white/5 pb-6'>
              <h3 className='text-sm font-black uppercase tracking-[0.4em] text-blue-400 font-tactical'>Candidate Logistics Comparison</h3>
              <button onClick={() => setShowAlts(false)} className='text-[10px] font-black text-gray-400 hover:text-white transition-colors tracking-widest uppercase'>Esc Close</button>
           </div>
            <div className='space-y-5 overflow-y-auto custom-scrollbar pr-4 h-full'>
               {alternatives.map((alt, idx) => (
                <div key={idx} className={`bg-white/5 border p-6 rounded-2xl flex justify-between items-center group transition-all ${alt.name === selectedHospital ? 'border-[#84adff]/40 bg-[#84adff]/5' : 'border-white/5 hover:border-white/10'}`}>
                   <div className='flex-grow'>
                      <div className='flex items-center gap-4 mb-2'>
                        <div className={`text-lg font-black font-tactical ${alt.name === selectedHospital ? 'text-[#84adff]' : 'text-gray-300'}`}>{alt.name}</div>
                        <div className='px-3 py-1 rounded bg-white/5 text-[9px] font-black uppercase text-gray-500 tracking-widest font-tactical border border-white/5'>{alt.specialty}</div>
                      </div>
                      <div className={`text-[11px] font-medium mt-2 leading-relaxed pr-8 max-w-md ${alt.name === selectedHospital ? 'text-blue-400/70' : 'text-orange-400/90'}`}>
                        <span className='opacity-50 mr-2 tracking-widest uppercase'>Reason_Diag:</span> {alt.name === selectedHospital ? 'Primary Tactical Objective Acquired.' : alt.rejection_reason}
                      </div>
                   </div>
                   <div className='text-right flex-none flex flex-col items-end gap-2'>
                      <div className='text-3xl font-black text-white font-mono tracking-tighter'>{alt.eta_minutes}<span className='text-xs opacity-40 ml-1'>M</span></div>
                      <div className='text-[10px] text-blue-500/60 uppercase font-black tracking-widest font-tactical'>RATING: {alt.capability_score}/10</div>
                   </div>
                </div>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
