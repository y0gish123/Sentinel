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

const STYLES = `
.root { display: grid; grid-template-rows: 56px 52px 1fr 60px; height: 100vh; width: 100vw; background: #080C12; overflow: hidden; font-family: 'JetBrains Mono', 'Courier New', monospace; box-sizing: border-box; }
.root * { box-sizing: border-box; }
.panel-border { border: 1px solid #1A2744; border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #1A2744; border-radius: 4px; }
@keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
@keyframes pulseGold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); } 70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
@keyframes pulseAmber { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
`;

function DetectionDashboard({ onComplete }) {
  const [frames, setFrames] = useState([]);
  const [isCollision, setIsCollision] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [frames]);

  useEffect(() => {
    const rawEvents = [
      { f: '001', s: 'SCANNING', c: '#60A5FA', bg: '#1A2744', desc: "Initializing detection pipeline..." },
      { f: '021', s: 'CLEAR', c: '#2D4A6B', bg: 'transparent', desc: "Vehicles: 3 | No proximity alert" },
      { f: '047', s: 'CLEAR', c: '#2D4A6B', bg: 'transparent', desc: "Vehicles: 4 | Normal traffic flow" },
      { f: '063', s: 'SCANNING', c: '#60A5FA', bg: '#1A2744', desc: "Lane change detected — monitoring" },
      { f: '089', s: 'CLEAR', c: '#2D4A6B', bg: 'transparent', desc: "Vehicles: 4 | Speed variance: normal" },
      { f: '098', s: 'FLAGGED', c: '#F59E0B', bg: '#2D1500', desc: "⚠ Proximity threshold flagged" },
      { f: '112', s: 'FLAGGED', c: '#F59E0B', bg: '#2D1500', desc: "⚠ Rapid deceleration detected" },
      { f: '118', s: 'FLAGGED', c: '#F59E0B', bg: '#2D1500', desc: "⚠ Vehicle 2 trajectory anomaly" },
      { f: '127', s: 'FLAGGED', c: '#F59E0B', bg: '#2D1500', desc: "⚠ IoU overlap: 0.34 — approaching" },
      { f: '135', s: 'FLAGGED', c: '#F59E0B', bg: '#2D1500', desc: "⚠ IoU overlap: 0.61 — CRITICAL" },
      { f: '142', s: 'COLLISION', c: '#EF4444', bg: '#2D0000', desc: "🚨 COLLISION CONFIRMED — IoU: 0.83" },
    ];
    let tIds = [];
    rawEvents.forEach((ev, idx) => {
      tIds.push(setTimeout(() => {
        setFrames(prev => [...prev, ev]);
        if (ev.f === '142') {
          setIsCollision(true);
          tIds.push(setTimeout(() => {
            setFrames(prev => [...prev, { f: '---', s: 'INFO', c: '#60A5FA', bg: 'transparent', desc: "Passing incident to TRIAGE AGENT..."}]);
          }, 800));
          tIds.push(setTimeout(onComplete, 2000));
        }
      }, idx * 250));
    });
    return () => tIds.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 300px', gap: '8px', padding: '8px', height: '100%', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: LIVE VIDEO FEED */}
      <div className="panel-border" style={{ background: '#0A0F1A', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #1A2744' }}>
          <span style={{ color: '#60A5FA', fontSize: '8px' }}>🎥 LIVE CAMERA FEED</span>
          <span style={{ color: '#EF4444', animation: 'pulseAmber 1s infinite', fontSize: '8px' }}>● REC</span>
        </div>
        <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', border: '1px solid #1A2744', position: 'relative', overflow: 'hidden' }}>
             {/* Fake Video Box */}
             <div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)' }}></div>
             {isCollision && (
               <>
                 <div style={{ position: 'absolute', top: '30%', left: '40%', width: '40px', height: '60px', border: '2px solid #22C55E' }}>
                   <div style={{ position: 'absolute', top: '-14px', color: '#22C55E', fontSize: '9px' }}>vehicle 0.87</div>
                 </div>
                 <div style={{ position: 'absolute', top: '38%', left: '48%', width: '45px', height: '50px', border: '2px solid #22C55E' }}>
                   <div style={{ position: 'absolute', top: '-14px', color: '#22C55E', fontSize: '9px' }}>vehicle 0.82</div>
                 </div>
                 <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: '#EF4444', color: 'white', fontSize: '9px', padding: '4px', fontWeight: 'bold' }}>⚠ COLLISION DETECTED</div>
               </>
             )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <div><div style={{ fontSize: '8px', color: '#4A5568' }}>FRAMES PROCESSED</div><div style={{ fontSize: '13px', color: '#60A5FA' }}>{frames.length > 0 ? parseInt(frames[frames.length-1].f) || 142 : 0}</div></div>
            <div><div style={{ fontSize: '8px', color: '#4A5568' }}>VEHICLES DETECTED</div><div style={{ fontSize: '13px', color: '#22C55E' }}>{isCollision ? 2 : (frames.length > 2 ? 4 : 3)}</div></div>
            <div><div style={{ fontSize: '8px', color: '#4A5568' }}>CONFIDENCE</div><div style={{ fontSize: '13px', color: '#22C55E' }}>{isCollision ? '87%' : '--'}</div></div>
            <div><div style={{ fontSize: '8px', color: '#4A5568' }}>SCAN RATE</div><div style={{ fontSize: '13px', color: '#8B949E' }}>24 FPS</div></div>
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: Log */}
      <div className="panel-border" style={{ background: isCollision ? 'rgba(239,68,68,0.05)' : '#060A10', display: 'flex', flexDirection: 'column', transition: 'background 0.5s' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #1A2744' }}>
          <span style={{ color: '#60A5FA', fontSize: '8px' }}>🔍 FRAME-BY-FRAME ANALYSIS</span>
          <span style={{ color: '#8B949E', fontSize: '8px' }}>FRAME {frames.length ? frames[frames.length-1].f : '000'} / 142</span>
        </div>
        <div className="custom-scrollbar" style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {frames.map((ev, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ color: '#4A5568', fontSize: '9px', width: '30px' }}>{ev.f}</span>
               <span style={{ background: ev.bg, color: ev.c, fontSize: '9px', padding: '2px 6px', borderRadius: '2px', width: '60px', textAlign: 'center' }}>{ev.s}</span>
               <span style={{ color: '#8B949E', fontSize: '9px' }}>{ev.desc}</span>
             </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* RIGHT COLUMN: Output Data */}
      <div className="panel-border" style={{ background: '#0A0F1A', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #1A2744' }}>
          <span style={{ color: '#60A5FA', fontSize: '8px' }}>📋 INCIDENT EXTRACTED DATA</span>
        </div>
        <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isCollision ? (
             <div style={{ color: '#2D4A6B', fontSize: '10px', textAlign: 'center', marginTop: '20px' }}>Awaiting detection...</div>
          ) : (
            <>
              <div style={{ border: '1px solid #1A2744', padding: '8px' }}>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>INCIDENT ID</div>
                 <div style={{ fontSize: '10px', color: '#60A5FA', marginBottom: '8px' }}>SENTINEL-20260403-001</div>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>TIMESTAMP</div>
                 <div style={{ fontSize: '10px', color: '#8B949E', marginBottom: '8px' }}>08:30:55.142</div>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>STATUS</div>
                 <div style={{ fontSize: '9px', color: 'white', background: '#EF4444', display: 'inline-block', padding: '2px 6px' }}>[COLLISION CONFIRMED]</div>
              </div>
              <div style={{ border: '1px solid #1A2744', padding: '8px' }}>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>CONFIDENCE SCORE</div>
                 <div style={{ fontSize: '10px', color: '#60A5FA', marginBottom: '8px' }}>██████████████░░ 87%</div>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>VEHICLES INVOLVED</div>
                 <div style={{ fontSize: '14px', color: '#22C55E', fontWeight: 'bold', marginBottom: '8px' }}>2</div>
                 <div style={{ fontSize: '8px', color: '#4A5568', marginBottom: '4px' }}>COLLISION FRAME</div>
                 <div style={{ fontSize: '10px', color: '#8B949E' }}>#142 of 142</div>
              </div>
              <div style={{ flex: 1 }}></div>
              <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid #60A5FA', color: '#60A5FA', fontSize: '9px', padding: '8px', textAlign: 'center', animation: 'pulseAmber 1.5s infinite' }}>
                ▶ PASSING TO TRIAGE AGENT...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TriageDashboard({ onComplete }) {
  const [text, setText] = useState("");
  const fullText = \`VISUAL SCENE ASSESSMENT:

Multi-vehicle collision confirmed on 
Outer Ring Road, Bengaluru. 

Two vehicles involved — impact appears 
to be a T-bone style collision based on 
vehicle positioning and deformation 
pattern visible in frame.

Vehicle 01 shows significant front-right 
structural damage. Airbag deployment 
likely. Driver/passenger injury risk: HIGH.

Vehicle 02 shows severe driver-side 
intrusion. This is the higher-risk 
vehicle — occupant extraction may be 
required before medical treatment.

INJURY PROBABILITY ASSESSMENT:

→ Head trauma: HIGH probability
  (T-bone impacts cause lateral 
  head movement exceeding safe limits)
  
→ Thoracic/abdominal injury: MODERATE
  (Seatbelt compression at high delta-V)

→ Spinal injury: MODERATE
  (Lateral impact without head restraint)

→ Entrapment risk: HIGH — Vehicle 02
  (Door frame intrusion visible)

SCENE HAZARDS DETECTED:

→ Road: FULLY BLOCKED — both lanes
→ Secondary accident risk: HIGH
  (Debris field visible)
→ Fire risk: LOW (no visible smoke)
→ Fuel leakage: UNCONFIRMED

MASS CASUALTY ASSESSMENT:
  Estimated casualties: 2-4 persons
  Critical care needed: IMMEDIATE

TRIAGE VERDICT:
  SEVERITY: CRITICAL — 8/10
  RESPONSE CLASS: P1 PRIORITY
  MECHANISM: High-energy blunt trauma
\`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, index + 1));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        setTimeout(onComplete, 2500);
      }
    }, 12);
    return () => clearInterval(interval);
  }, []);

  const highlight = (t) => {
    let res = t;
    res = res.replace(/CRITICAL/g, '<span style="color:#EF4444; font-weight:bold;">CRITICAL</span>');
    res = res.replace(/BLOCKED/g, '<span style="color:#EF4444; font-weight:bold;">BLOCKED</span>');
    res = res.replace(/HIGH/g, '<span style="color:#EF4444; font-weight:bold;">HIGH</span>');
    res = res.replace(/MODERATE/g, '<span style="color:#F59E0B; font-weight:bold;">MODERATE</span>');
    res = res.replace(/LOW/g, '<span style="color:#22C55E; font-weight:bold;">LOW</span>');
    return { __html: res.replace(/\n/g, '<br/>').replace(/→/g, '<span style="color:#F59E0B;">→</span>') };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '8px', padding: '8px', height: '100%', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: SNAPSHOT */}
      <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A00', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2D1A00' }}>
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>📸 CRASH SNAPSHOT — FRAME 142</span>
          <span style={{ color: '#2D4A6B', fontSize: '7px' }}>PASSED FROM DETECTION</span>
        </div>
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '100%', height: '140px', background: '#000', position: 'relative', border: '1px solid #2D1A00', overflow: 'hidden' }}>
             {/* Fake canvas annotations */}
             <div style={{ position: 'absolute', top: '20px', left: '30px', width: '60px', height: '40px', border: '1px dashed #EF4444' }}>
                <div style={{ position: 'absolute', top: '105%', left: '0', color: '#EF4444', fontSize: '8px' }}>VEHICLE 01<br/><span style={{color:'#F59E0B', fontSize:'7px'}}>IMPACT: FRONT-RIGHT</span></div>
             </div>
             <div style={{ position: 'absolute', top: '40px', left: '120px', width: '50px', height: '60px', border: '1px dashed #F59E0B' }}>
                <div style={{ position: 'absolute', top: '105%', left: '0', color: '#F59E0B', fontSize: '8px' }}>VEHICLE 02<br/><span style={{color:'#F59E0B', fontSize:'7px'}}>IMPACT: DRIVER SIDE</span></div>
             </div>
             <div style={{ position: 'absolute', bottom: '0', width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', fontSize: '8px', padding: '4px', textAlign: 'center' }}>
                CONFIDENCE: 87% | FRAME: 142 | YOLO: v8
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', background: '#2D0000', color: '#EF4444', padding: '6px' }}>IMPACT FORCE: HIGH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', background: '#1A2000', color: '#F59E0B', padding: '6px' }}>VEHICLES: 2</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', background: '#2D0000', color: '#EF4444', padding: '6px' }}>ROAD STATUS: BLOCKED</div>
        </div>
      </div>

      {/* CENTER COLUMN: TYPEWRITER AI */}
      <div className="panel-border" style={{ background: '#060A10', borderColor: '#2D1A00', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2D1A00' }}>
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>🧠 TRIAGE AGENT — AI REASONING</span>
        </div>
        <div className="custom-scrollbar" style={{ padding: '16px', overflowY: 'auto', flex: 1, color: '#C8D8E8', fontSize: '9px', lineHeight: '1.5' }}>
          <div style={{ color: '#F59E0B', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>━━━ TRIAGE ANALYSIS INITIATED ━━━</div>
          <div dangerouslySetInnerHTML={highlight(text)} />
          {text.length < fullText.length && <span style={{ color: '#F59E0B', animation: 'pulseAmber 1s infinite' }}>_</span>}
          {text.length === fullText.length && <div style={{ color: '#F59E0B', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', marginTop: '12px' }}>━━━ PASSING TO RESOURCE AGENT ━━━</div>}
        </div>
      </div>

      {/* RIGHT COLUMN: SCORECARD */}
      <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A00', display: 'flex', flexDirection: 'column' }}>
         <div style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #2D1A00' }}>
          <span style={{ color: '#F59E0B', fontSize: '8px' }}>📊 TRIAGE SCORECARD</span>
         </div>
         <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div>
              <div style={{ color: '#4A5568', fontSize: '8px' }}>SEVERITY SCORE</div>
              <div style={{ color: '#EF4444', fontSize: '72px', fontWeight: 'bold', lineHeight: '1' }}>8<span style={{ color: '#4A5568', fontSize: '16px' }}> / 10</span></div>
              <div style={{ background: '#EF4444', color: 'white', fontSize: '11px', display: 'inline-block', padding: '4px 12px', borderRadius: '4px', marginTop: '4px' }}>[CRITICAL]</div>
            </div>
            <div>
              <div style={{ color: '#4A5568', fontSize: '8px' }}>RESPONSE CLASS</div>
              <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 'bold' }}>P1 — IMMEDIATE</div>
            </div>
            <hr style={{ borderColor: '#1A2744', margin: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8B949E' }}>Head Trauma <span style={{color: '#EF4444'}}>████████░░ HIGH</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8B949E' }}>Thoracic <span style={{color: '#F59E0B'}}>██████░░░░ MODERATE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8B949E' }}>Spinal <span style={{color: '#F59E0B'}}>██████░░░░ MODERATE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8B949E' }}>Entrapment <span style={{color: '#EF4444'}}>████████░░ HIGH</span></div>
            </div>
            <hr style={{ borderColor: '#1A2744', margin: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <div style={{ color: '#4A5568', fontSize: '8px' }}>MINIMUM RESPONSE REQUIRED</div>
               <div style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#60A5FA', padding: '4px 10px', borderRadius: '12px', fontSize: '9px', alignSelf: 'flex-start' }}>● AMBULANCE (ALS)</div>
               <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B', padding: '4px 10px', borderRadius: '12px', fontSize: '9px', alignSelf: 'flex-start' }}>● FIRE RESCUE</div>
               <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', color: '#A78BFA', padding: '4px 10px', borderRadius: '12px', fontSize: '9px', alignSelf: 'flex-start' }}>● POLICE UNIT</div>
            </div>
         </div>
      </div>
    </div>
  );
}

export { STYLES, DetectionDashboard, TriageDashboard };
