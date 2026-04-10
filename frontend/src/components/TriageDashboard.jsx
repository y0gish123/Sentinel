import React, { useState, useEffect, useRef } from 'react';

export default function TriageDashboard({ data, logs, active }) {
  const [displayedText, setDisplayedText] = useState('');
  const [severity, setSeverity] = useState(0);
  const triage = data || {};
  const scrollRef = useRef(null);

  // Typewriter effect for reasoning
  useEffect(() => {
    if (active && triage.triage_reasoning) {
      setDisplayedText('');
      const text = String(triage.triage_reasoning);
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          const char = text[index];
          if (char !== undefined) {
             setDisplayedText((prev) => prev + char);
          }
          index++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [active, triage.triage_reasoning]);

  // Count up for severity
  useEffect(() => {
    if (active && triage.severity_score) {
      setSeverity(0);
      let val = 0;
      const interval = setInterval(() => {
        val += 0.5;
        setSeverity(val);
        if (val >= triage.severity_score) {
          setSeverity(triage.severity_score);
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [active, triage.severity_score]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  const getApiUrl = (path) => {
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    return `${API_BASE}${path}`;
  };

  const getRiskLevel = (val) => {
    if (val >= 0.7) return { color: '#EF4444', level: 'HIGH' };
    if (val >= 0.4) return { color: '#F59E0B', level: 'MODERATE' };
    return { color: '#10B981', level: 'LOW' };
  };

  const headRisk = getRiskLevel(triage.head_trauma_risk || 0);
  const thoracicRisk = getRiskLevel(triage.thoracic_trauma_risk || 0);
  const spinalRisk = getRiskLevel(triage.spinal_trauma_risk || 0);
  const entrapmentRisk = getRiskLevel(triage.entrapment_probability || 0);

  const riskBars = [
    { label: 'Head Trauma', value: (triage.head_trauma_risk || 0) * 100, ...headRisk },
    { label: 'Thoracic', value: (triage.thoracic_trauma_risk || 0) * 100, ...thoracicRisk },
    { label: 'Spinal', value: (triage.spinal_trauma_risk || 0) * 100, ...spinalRisk },
    { label: 'Entrapment', value: (triage.entrapment_probability || 0) * 100, ...entrapmentRisk },
  ];

  const getImpactForce = (score) => {
    if (!score) return 'STANDBY';
    if (score >= 8) return 'CRITICAL';
    if (score >= 5) return 'HIGH';
    if (score >= 3) return 'MODERATE';
    return 'LOW';
  };

  const getRoadStatus = (score) => {
    if (!score) return 'STANDBY';
    if (score >= 7) return 'CRITICAL BLOCK';
    if (score >= 4) return 'PARTIAL BLOCK';
    return 'MARGINAL BLOCK';
  };

  return (
    <div className={`grid grid-cols-[340px_1fr_360px] gap-6 p-6 h-full transition-all duration-500 overflow-hidden ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* LEFT PANEL: CRASH DATA SNAPSHOT */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <span className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Impact Evidence</span>
          <span className="text-[9px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black tracking-widest uppercase border border-amber-100 italic">FRAME ANALYZED</span>
        </div>
        
        <div className="p-6 flex-1 flex flex-col gap-6">
          <div className="aspect-[4/3] bg-zinc-900 rounded-2xl relative overflow-hidden border-4 border-white shadow-xl group">
             <img 
               src={data.snapshot_url ? getApiUrl(data.snapshot_url) : getApiUrl('/uploads/detection_snapshot.jpg')} 
               className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
               alt="Crash Snapshot"
               onError={(e) => {
                 e.target.parentNode.className = "aspect-[4/3] bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center";
                 e.target.style.display = 'none';
                 e.target.parentNode.innerHTML = '<span class="text-[10px] font-black text-zinc-300 tracking-widest uppercase">Visual Proof Ready</span>';
               }}
             />
             
             {/* Simulated Bounding Boxes */}
             <div className="absolute top-1/2 left-1/4 w-32 h-20 border-2 border-red-500/80 bg-red-500/10 rounded-sm">
                <span className="absolute -top-6 left-0 text-[8px] font-black text-white bg-red-600 px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">Vehicle 01</span>
             </div>
             <div className="absolute top-[45%] right-1/4 w-24 h-24 border-2 border-red-500/80 bg-red-500/10 rounded-sm">
                <span className="absolute -top-6 left-0 text-[8px] font-black text-white bg-red-600 px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">Vehicle 02</span>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'Estimated Impact Force', value: getImpactForce(triage.severity_score), scale: 'SCALAR-V', color: 'text-red-600' },
              { label: 'Vehicle Payload Count', value: triage.vehicles_detected || '0', scale: 'UNITS', color: 'text-amber-600' },
              { label: 'Thoroughfare Status', value: getRoadStatus(triage.severity_score), scale: 'STATUS', color: 'text-red-700' }
            ].map((metric, i) => (
              <div key={metric.label} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{metric.label}</span>
                    <span className="text-[8px] font-bold text-zinc-300 tracking-tighter uppercase">{metric.scale}</span>
                 </div>
                 <span className={`text-[11px] font-black tracking-widest ${metric.color}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: STRATEGIC REASONING */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
          <span className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Triage Strategic reasoning</span>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 font-sans leading-relaxed custom-scrollbar bg-slate-50/20">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-black tracking-[0.2em] uppercase">Intelligence Synthesis In Progress</div>
               </div>
               
               <p className="text-sm text-zinc-600 font-medium leading-[1.8] border-l-2 border-amber-200 pl-6 py-2 italic font-serif bg-white p-6 rounded-2xl shadow-sm border border-amber-50">
                 "{displayedText}"
                 <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse align-middle"></span>
               </p>
            </div>

            {severity > 0 && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="bg-amber-600 text-white p-6 rounded-2xl shadow-xl shadow-amber-100 border border-amber-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24">
                      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/>
                    </svg>
                  </div>
                  <div className="text-[10px] font-black tracking-[0.3em] mb-2 uppercase opacity-80">Final Triage Verdict</div>
                  <div className="text-xl font-black uppercase tracking-wide leading-tight">
                    {triage.severity_label || 'Priority 1: Immediate Field Intervention Required'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: METRIC SCORECARD */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-4 bg-zinc-50/50">
          <span className="text-[10px] font-black text-amber-600 tracking-[0.2em] uppercase">Triage Scorecard</span>
        </div>
        
        <div className="p-8 flex-1 flex flex-col gap-10 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-2 py-6 bg-zinc-50 rounded-3xl border border-zinc-100 shrink-0">
            <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Composite Severity</span>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-zinc-900 leading-none tracking-tighter">{severity.toFixed(0)}</span>
              <span className="text-xl font-black text-zinc-300">/ 10</span>
            </div>
            <div className="mt-4 bg-red-600 text-white px-5 py-1.5 rounded-full shadow-lg shadow-red-100">
               <span className="text-[10px] font-black tracking-[0.3em] uppercase">Critical Alert</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {riskBars.map((bar) => (
              <div key={bar.label} className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{bar.label}</span>
                  <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: bar.color }}>{bar.level}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1500 ease-out rounded-full"
                    style={{ 
                      width: active ? `${bar.value}%` : '0%', 
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2">
             <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase block mb-4 border-b border-zinc-100 pb-2">Mandatory Unit Dispatch</span>
             <div className="flex flex-col gap-2">
                {Array.isArray(triage.services_dispatched) && triage.services_dispatched.length > 0 ? triage.services_dispatched.map((service, i) => {
                  let color = 'border-zinc-100 text-zinc-700 bg-zinc-50';
                  let label = service.toUpperCase();
                  if (service.toLowerCase().includes('ambulance')) {
                    color = 'border-blue-100 text-blue-700 bg-blue-50';
                    label = 'ALS Ambulance Unit';
                  } else if (service.toLowerCase().includes('fire')) {
                    color = 'border-amber-100 text-amber-700 bg-amber-50';
                    label = 'Heavy Rescue Engine';
                  } else if (service.toLowerCase().includes('police')) {
                    color = 'border-indigo-100 text-indigo-700 bg-indigo-50';
                    label = 'Tactical Police Support';
                  }
                  
                  return (
                    <div key={i} className={`px-4 py-3 rounded-xl border font-black text-[10px] tracking-widest uppercase ${color}`}>
                       {label}
                    </div>
                  );
                }) : (
                  <div className="px-4 py-3 rounded-xl border font-black text-[10px] tracking-widest uppercase border-zinc-100 text-zinc-400 bg-zinc-50">
                    Awaiting Triage Processing...
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
