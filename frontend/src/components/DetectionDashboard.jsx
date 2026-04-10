import React, { useRef, useEffect, useState } from 'react';

export default function DetectionDashboard({ data, logs, active, missionId }) {
  const logEndRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const detection = data || {};
  const isCollision = detection.crash_detected;
  const isProcessing = active && !detection.incident_id;

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getApiUrl = (path) => {
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    return `${API_BASE}${path}`;
  };

  return (
    <div className={`grid grid-cols-[360px_1fr_360px] gap-6 p-6 h-full transition-all duration-500 overflow-hidden ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* LEFT PANEL: TACTICAL FEED */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Tactical Feed</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] text-red-600 font-bold tracking-widest uppercase">Live</span>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6">
          <div className={`aspect-video bg-zinc-900 rounded-xl relative overflow-hidden border-2 transition-all duration-500 ${isCollision ? 'border-red-500 shadow-lg shadow-red-100' : 'border-zinc-100'}`}>
            {!videoError ? (
              <>
                <video 
                  key={`${missionId}-${detection.timestamp || 'idle'}`}
                  src={getApiUrl(`/api/stream-video?t=${missionId || detection.timestamp || "idle"}`)} 
                  autoPlay muted loop onError={() => setVideoError(true)}
                  className={`w-full h-full object-cover ${isCollision ? 'opacity-90' : 'opacity-100'}`}
                />
                {!isProcessing && Array.isArray(detection.tactical_boxes) && detection.tactical_boxes.map((box, i) => (
                  <div 
                    key={i} 
                    className="absolute border-[1.5px] border-[#00ff00] z-10 pointer-events-none shadow-[0_0_8px_rgba(0,255,0,0.5)]"
                    style={{
                      left: `${box.left}%`,
                      top: `${box.top}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`
                    }}
                  >
                    <span className="absolute -top-3 left-0 text-[#00ff00] text-[6px] font-black tracking-widest bg-black/60 px-1 border border-[#00ff00]/40">
                      TARGET LOCK
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-50">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-[10px] text-zinc-400 font-black tracking-widest">Uplink Connecting...</span>
              </div>
            )}

            {isCollision && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span className="text-[10px] font-black tracking-widest">COLLISION DETECTED</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Frames Decoded', value: isProcessing || !detection.frame_number ? 'SCN-...' : detection.frame_number.toString(), color: 'text-blue-600' },
              { label: 'Assets Identified', value: isProcessing ? '---' : (detection.vehicles_detected || '0'), color: 'text-blue-600' },
              { label: 'Detection Integrity', value: isProcessing ? '0%' : `${detection.confidence ? (detection.confidence * 100).toFixed(0) : '0'}%`, color: 'text-emerald-600' },
              { label: 'Stream Latency', value: isProcessing || !detection.processing_time_ms ? '---' : `${detection.processing_time_ms}ms`, color: 'text-zinc-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
                <span className="text-[9px] text-zinc-400 font-black block mb-1 uppercase tracking-widest">{stat.label}</span>
                <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: LOGICAL ANALYSIS */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Logical Analysis System</span>
          <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase">Active Buffer</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-50/30">
          <div className="flex flex-col gap-3">
            {logs.filter(l => l.category === 'DETECTION').map((log, i) => {
              const weight = log.message.includes('COLLISION') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-zinc-100 text-zinc-600';
              return (
                <div key={i} className={`flex items-start gap-5 p-4 rounded-xl border transition-all ${weight}`}>
                  <span className="text-[10px] font-black opacity-30 mt-0.5 min-w-[30px]">#{`00${i+1}`.slice(-3)}</span>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-black leading-tight">{log.message}</span>
                    <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: TELEMETRY DATA */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Intelligence Extraction</span>
        </div>
        
        <div className="p-8 flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase">Target Identifier</span>
            <span className="text-xl font-black text-zinc-900 tracking-tight">{detection.incident_id || 'UPLINK-STANDBY'}</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase">Confidence Profile</span>
              <span className="text-sm text-blue-600 font-black">{detection.confidence ? (detection.confidence * 100).toFixed(0) : '0'}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full ${isProcessing ? 'bg-zinc-200 animate-pulse' : 'bg-blue-500'} transition-all duration-1000`}
                 style={{ width: `${isProcessing ? 100 : (detection.confidence ? detection.confidence * 100 : 0)}%` }}
               ></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase text-center block mb-2">Primary Detection Snapshot</span>
              <div className="aspect-[4/3] bg-zinc-900 rounded-2xl border-4 border-white shadow-xl overflow-hidden relative group">
                {detection.snapshot_url ? (
                  <img 
                    src={getApiUrl(detection.snapshot_url)} 
                    alt="Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-950 relative overflow-hidden">
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/30 animate-scan"></div>
                    
                    <div className="w-12 h-12 border border-zinc-800 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-0 border-t-2 border-blue-500/40 rounded-full animate-spin"></div>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1.5 z-10">
                      <span className="text-[10px] font-black text-blue-500/60 tracking-[0.4em] uppercase animate-pulse">Scanning</span>
                      <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Awaiting Vision Lock</span>
                    </div>
                  </div>
                )}
              </div>
          </div>

          <div className="mt-auto">
            <div className={`p-4 rounded-xl border text-center ${isCollision ? 'border-red-200 bg-red-50' : 'border-blue-100 bg-blue-50'}`}>
              <span className={`text-[11px] font-black tracking-widest uppercase ${isCollision ? 'text-red-700' : 'text-blue-700'}`}>
                {isCollision ? 'COLLISION POSITIVE' : 'SCANNING ENVIRONMENT'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
