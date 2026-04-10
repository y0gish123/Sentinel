const fs = require('fs');

let part1 = fs.readFileSync('src/App_part1.js', 'utf8');
let part2 = fs.readFileSync('src/App_part2.js', 'utf8');

const filterOut = (text) => text.split('\n').filter(l => !l.startsWith('import ') && !l.startsWith('export ')).join('\n');

part1 = filterOut(part1);
part2 = filterOut(part2);

let appFooter = `
export default function App() {
  const [pipelineState, setPipelineState] = React.useState({
    status: 'idle',
    activeAgent: null,
    completedAgents: []
  });
  
  const [time, setTime] = React.useState('');
  
  React.useEffect(() => {
     const t = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
     }, 1000);
     return () => clearInterval(t);
  }, []);

  const handleSimulate = () => {
    if (pipelineState.status !== 'idle' && pipelineState.status !== 'complete') return;
    setPipelineState({
       status: 'running',
       activeAgent: 'detection',
       completedAgents: []
    });
  };

  const handleReset = () => {
    setPipelineState({
       status: 'idle',
       activeAgent: null,
       completedAgents: []
    });
  };

  const onDetectionComplete = () => {
     setPipelineState(prev => ({
        ...prev,
        completedAgents: ['detection'],
        activeAgent: 'triage'
     }));
  };

  const onTriageComplete = () => {
     setPipelineState(prev => ({
        ...prev,
        completedAgents: ['detection', 'triage'],
        activeAgent: 'resource'
     }));
  };

  const onResourceComplete = () => {
     setPipelineState(prev => ({
        ...prev,
        completedAgents: ['detection', 'triage', 'resource'],
        activeAgent: 'allocation'
     }));
  };

  const onAllocationComplete = () => {
     setPipelineState(prev => ({
        ...prev,
        status: 'complete',
        completedAgents: ['detection', 'triage', 'resource', 'allocation']
     }));
  };

  return (
    <>
      <style>{STYLES + '\\n@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }'}</style>
      <div className="root">
        {/* ROW 1: HEADER */}
        <div style={{ height: '56px', background: '#080C12', borderBottom: '1px solid #1A2744', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
           <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
             <span style={{ color: '#EF4444', fontSize: '20px', fontWeight: 900, letterSpacing: '0.2em' }}>SENTINEL</span>
             <span style={{ color: '#2D4A6B', fontSize: '9px', letterSpacing: '0.25em' }}>AGENTIC EMERGENCY RESPONSE</span>
           </div>
           <div>
             {pipelineState.status === 'idle' && <span style={{ color: '#2D4A6B', fontSize: '10px', letterSpacing: '0.15em' }}>● SYSTEM READY</span>}
             {pipelineState.status === 'running' && <span style={{ color: '#F59E0B', fontSize: '10px', letterSpacing: '0.15em', animation: 'pulseAmber 2s infinite' }}>● PIPELINE RUNNING</span>}
             {pipelineState.status === 'complete' && <span style={{ color: '#22C55E', fontSize: '10px', letterSpacing: '0.15em' }}>✓ PIPELINE COMPLETE</span>}
           </div>
           <div>
             {pipelineState.status === 'running' ? (
                <button disabled style={{ background: '#EF4444', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', padding: '10px 20px', borderRadius: '6px', border: 'none', opacity: 0.5 }}>⟳ RUNNING...</button>
             ) : pipelineState.status === 'complete' ? (
                <button onClick={handleReset} style={{ background: '#1A2744', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>↺ RESET</button>
             ) : (
                <button onClick={handleSimulate} style={{ background: '#EF4444', color: 'white', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>▶ SIMULATE CRASH</button>
             )}
           </div>
        </div>

        {/* ROW 2: NAVIGATOR */}
        <div style={{ height: '52px', background: '#060A10', borderBottom: '1px solid #1A2744', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
           {[
             { id: 'detection', num: '01', name: 'DETECTION AGENT', sub: 'YOLOv8 + Vision AI', color: '#60A5FA' },
             { id: 'triage', num: '02', name: 'TRIAGE AGENT', sub: 'Medical Severity', color: '#F59E0B' },
             { id: 'resource', num: '03', name: 'RESOURCE AGENT', sub: 'Facility Scouting', color: '#A78BFA' },
             { id: 'allocation', num: '04', name: 'ALLOCATION AGENT', sub: 'Route & Dispatch', color: '#EF4444' }
           ].map((tab, i) => {
              const isLocked = !pipelineState.completedAgents.includes(tab.id) && pipelineState.activeAgent !== tab.id;
              const isActive = pipelineState.activeAgent === tab.id;
              const isComplete = pipelineState.completedAgents.includes(tab.id);
              
              let bg = 'transparent', bColor = 'transparent', circBg = 'transparent', circColor = '#2D4A6B', circBorder = '1px solid #1A2744', nameColor = '#2D4A6B', statColor = '#1A2744', statText = 'WAITING';
              
              if (isActive) {
                 bg = Object.assign({}, tab.color.startsWith('#6')?{backgroundColor:'rgba(96,165,250,0.08)'}:tab.color.startsWith('#F')?{backgroundColor:'rgba(245,158,11,0.08)'}:tab.color.startsWith('#A')?{backgroundColor:'rgba(167,139,250,0.08)'}:{backgroundColor:'rgba(239,68,68,0.08)'}).backgroundColor;
                 bColor = tab.color;
                 circBg = tab.color;
                 circColor = 'white';
                 circBorder = 'none';
                 nameColor = tab.color;
                 statColor = tab.color;
                 statText = '● PROCESSING';
              } else if (isComplete) {
                 bg = 'rgba(34,197,94, 0.05)';
                 bColor = '#22C55E';
                 circBg = '#22C55E';
                 circColor = 'white';
                 circBorder = 'none';
                 nameColor = '#22C55E';
                 statColor = '#22C55E';
                 statText = 'COMPLETE';
              }

              return (
                 <React.Fragment key={tab.id}>
                    <div 
                      onClick={() => {
                        if (isComplete) {
                           setPipelineState(prev => ({...prev, activeAgent: tab.id}));
                        }
                      }}
                      style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: bg, borderBottom: isComplete ? '2px solid ' + bColor : '2px solid transparent', cursor: isComplete ? 'pointer' : (isActive ? 'default' : 'not-allowed') }}>
                       <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: circBg, color: circColor, border: circBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', boxShadow: isActive ? '0 0 10px ' + tab.color : 'none' }}>
                          {isComplete ? '✓' : tab.num}
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: nameColor, fontSize: '10px', fontWeight: isActive ? '700' : 'normal' }}>{tab.name}</span>
                          <span style={{ color: statColor, fontSize: '8px', animation: isActive ? 'pulseAmber 1s infinite' : 'none' }}>{statText}</span>
                       </div>
                    </div>
                    {i < 3 && <div style={{ color: isComplete ? '#22C55E' : '#1A2744', fontSize: '12px', margin: '0 8px' }}>━━▶</div>}
                 </React.Fragment>
              )
           })}
        </div>
        
        {/* ROW 3: DASHBOARD */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
           {pipelineState.activeAgent === null && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2D4A6B', fontSize: '12px' }}>
                 AWAITING PIPELINE INITIALIZATION
              </div>
           )}
           {pipelineState.activeAgent === 'detection' && <DetectionDashboard onComplete={onDetectionComplete} />}
           {pipelineState.activeAgent === 'triage' && <TriageDashboard onComplete={onTriageComplete} />}
           {pipelineState.activeAgent === 'resource' && <ResourceDashboard onComplete={onResourceComplete} />}
           {pipelineState.activeAgent === 'allocation' && <AllocationDashboard onComplete={onAllocationComplete} />}
        </div>

        {/* ROW 4: STATUS */}
        <div style={{ height: '60px', background: '#060A10', borderTop: '1px solid #1A2744', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
           {[
             { l: 'STATUS', v: pipelineState.status === 'idle' ? 'STANDBY' : (pipelineState.status === 'running' ? 'ACTIVE' : 'CRITICAL'), c: pipelineState.status === 'idle' ? '#2D4A6B' : (pipelineState.status === 'running' ? '#F59E0B' : '#EF4444') },
             { l: 'ACTIVE AGENT', v: pipelineState.activeAgent ? pipelineState.activeAgent.toUpperCase() : '—', c: pipelineState.activeAgent==='detection'?'#60A5FA':(pipelineState.activeAgent==='triage'?'#F59E0B':(pipelineState.activeAgent==='resource'?'#A78BFA':(pipelineState.activeAgent==='allocation'?'#EF4444':(pipelineState.status==='complete'?'#22C55E':'#2D4A6B')))) },
             { l: 'TRIAGE SCORE', v: pipelineState.completedAgents.includes('triage') ? '8 / 10' : '—', c: pipelineState.completedAgents.includes('triage') ? '#EF4444' : '#2D4A6B' },
             { l: 'TARGET HOSPITAL', v: pipelineState.completedAgents.includes('resource') ? 'Manipal Hospital' : '—', c: pipelineState.completedAgents.includes('resource') ? '#22C55E' : '#2D4A6B' },
             { l: 'EMS ETA', v: pipelineState.completedAgents.includes('resource') ? '13.2 MIN' : '—', c: pipelineState.completedAgents.includes('resource') ? '#F59E0B' : '#2D4A6B' },
             { l: 'SYSTEM CLOCK', v: time, c: '#4A5568' }
           ].map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRight: i < 5 ? '1px solid #1A2744' : 'none' }}>
                 <div style={{ color: '#2D4A6B', fontSize: '7px', letterSpacing: '0.15em' }}>{item.l}</div>
                 <div style={{ color: item.c, fontSize: i === 4 && item.v !== '—' ? '16px' : (i===3 && item.v !== '—' ? '10px' : '13px'), fontWeight: 'bold' }}>{item.v}</div>
              </div>
           ))}
        </div>
      </div>
    </>
  );
}
`;

let imports = `
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
`;

let finalFile = imports + "\\n\\n" + part1 + "\\n\\n" + part2 + "\\n\\n" + appFooter;

fs.writeFileSync('src/App.jsx', finalFile);
console.log('App.jsx has been correctly populated from App_part1.js and App_part2.js!');
