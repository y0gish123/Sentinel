import React, { useState, useEffect } from 'react';

export default function StatusBar({ connectionStatus, pipelineState, incidentData }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = () => {
    if (pipelineState.status === 'complete') return '#10B981';
    if (pipelineState.status === 'running') return '#EF4444';
    return '#475569';
  };

  const sections = [
    { label: 'STATUS', value: pipelineState.status === 'complete' ? 'MISSION SUCCESS' : (pipelineState.status === 'running' ? 'ACTIVE / CRITICAL' : 'STANDBY'), color: getStatusColor() },
    { label: 'ACTIVE AGENT', value: pipelineState.activeAgent ? pipelineState.activeAgent.toUpperCase() : 'NONE', color: '#60A5FA' },
    { label: 'TRIAGE SCORE', value: incidentData.severity_score ? `${incidentData.severity_score}/10` : '-- / 10', color: '#F59E0B' },
    { label: 'TARGET HOSPITAL', value: incidentData.selected_hospital || '--', color: '#A78BFA' },
    { label: 'EMS ETA', value: incidentData.hospital_eta ? `${incidentData.hospital_eta} MIN` : '-- MIN', color: '#EF4444' },
    { label: 'SYSTEM CLOCK', value: time, color: '#475569' }
  ];

  return (
    <div className="w-full h-full bg-slate-900 border-t border-slate-800 flex items-center px-10 shadow-2xl z-[100]">
      {sections.map((section, i) => (
        <React.Fragment key={section.label}>
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <span className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">{section.label}</span>
            <span 
              className="text-[11px] font-black tracking-widest transition-all duration-300"
              style={{ color: section.color }}
            >
              {section.value}
            </span>
          </div>
          {i < sections.length - 1 && (
            <div className="h-8 w-[2px] bg-slate-800 mx-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
