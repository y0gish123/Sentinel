import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: false });
  }, [center, zoom, map]);
  return null;
};

const createDivIcon = (color, label, pulse = false) => new L.DivIcon({
  className: 'bg-transparent border-none',
  html: \`<div style="width:20px; height:20px; border-radius:50%; background-color:\${color}; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border: 2px solid white; \${pulse ? \`animation: pulse\${color==='#F59E0B'?'Gold':'Red'} 2s infinite;\` : ''}">\${label}</div>\`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const redAlertIcon = createDivIcon('#EF4444', '!', true);
const hospIcon = createDivIcon('#3B82F6', 'H');
const hospSelectedIcon = createDivIcon('#F59E0B', 'H', true);
const policeIcon = createDivIcon('#A78BFA', 'P');
const fireIcon = createDivIcon('#F97316', 'F');
const ambMarker = new L.DivIcon({ className:'bg-transparent border-none', html:'<div style="font-size:20px;">🚑</div>', iconSize:[20,20], iconAnchor:[10,10]});
const fireMarker = new L.DivIcon({ className:'bg-transparent border-none', html:'<div style="font-size:20px;">🚒</div>', iconSize:[20,20], iconAnchor:[10,10]});
const polMarker = new L.DivIcon({ className:'bg-transparent border-none', html:'<div style="font-size:20px;">🚓</div>', iconSize:[20,20], iconAnchor:[10,10]});

function ResourceDashboard({ onComplete }) {
  const [logs, setLogs] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [cards, setCards] = useState([]);
  
  const incidentCoords = [12.9716, 77.5946];
  const hospitals = [
    { n: "Manipal Hospital", ll: [12.9523, 77.6401], c: 9, eta: 13.2, dist: 4.8, tr: true },
    { n: "St. John's Medical", ll: [12.9257, 77.6162], c: 8, eta: 18.4, dist: 7.1, tr: true },
    { n: "Sakra World Hospital", ll: [12.9399, 77.6955], c: 7, eta: 22.1, dist: 9.3, tr: true },
    { n: "Apollo Bannerghatta", ll: [12.8921, 77.5973], c: 9, eta: 26.8, dist: 11.2, tr: true },
    { n: "Fortis Cunningham", ll: [13.0046, 77.5766], c: 8, eta: 19.3, dist: 8.6, tr: true }
  ];
  const polices = [[12.9348, 77.6736], [12.9590, 77.7006], [12.9638, 77.6571]];
  const fires = [[12.9612, 77.6391], [12.9617, 77.6502]];

  useEffect(() => {
    let tIds = [];
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Querying Overpass API..."]), 200));
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Radius: 5km from incident"]), 600));
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Found: 5 hospitals"]), 1000));
    
    hospitals.forEach((h, i) => {
      tIds.push(setTimeout(() => setMarkers(p => [...p, { type: 'hosp', ll: h.ll, id: i }]), 1000 + i * 800));
    });
    
    let baseTime = 1000 + hospitals.length * 800;
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Found: 3 police stations"]), baseTime));
    polices.forEach((p, i) => tIds.push(setTimeout(() => setMarkers(prev => [...prev, { type: 'pol', ll: p, id: 10+i }]), baseTime + i*300)));
    
    baseTime += polices.length * 300;
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Found: 2 fire stations"]), baseTime));
    fires.forEach((f, i) => tIds.push(setTimeout(() => setMarkers(prev => [...prev, { type: 'fire', ll: f, id: 20+i }]), baseTime + i*300)));
    
    baseTime += fires.length * 300;
    tIds.push(setTimeout(() => setLogs(p => [...p, "→ Scoring by capability + ETA..."]), baseTime));
    
    hospitals.forEach((h, i) => {
       tIds.push(setTimeout(() => setCards(prev => [...prev, h]), baseTime + 500 + i * 600));
    });
    
    baseTime += 500 + hospitals.length * 600;
    tIds.push(setTimeout(() => setLogs(p => [...p, "✓ Selection complete"]), baseTime));
    tIds.push(setTimeout(() => {
       setMarkers(prev => prev.map(m => m.id === 0 ? {...m, type: 'selected'} : m));
    }, baseTime + 500));
    
    tIds.push(setTimeout(onComplete, baseTime + 3000));

    return () => tIds.forEach(clearTimeout);
  }, []);

  const selCard = cards.length === 5;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '8px', padding: '8px', height: '100%', overflow: 'hidden' }}>
      <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A44', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #2D1A44' }}>
          <span style={{ color: '#A78BFA', fontSize: '8px' }}>📦 RESOURCE REQUIREMENTS</span>
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
           <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid #2D1A44', borderRadius: '6px', padding: '8px', fontSize: '9px', color: '#8B949E' }}>
              Severity 8/10 CRITICAL<br/>Vehicles: 2 | Entrapment: LIKELY
           </div>
           <div style={{ color: '#4A5568', fontSize: '8px' }}>DISPATCHING:</div>
           {[{i:'🚑', n:'ALS Ambulance — 1 Unit', s:'REQUIRED', c:'#EF4444'}, {i:'🚒', n:'Hydraulic Rescue — 1 Unit', s:'REQUIRED', c:'#EF4444'}, {i:'🚓', n:'Traffic Control — 1 Unit', s:'REQUIRED', c:'#A78BFA'}, {i:'🏥', n:'Level 1 Trauma Center', s:selCard?'SELECTED':'SCOUTING...', c:selCard?'#22C55E':'#F59E0B'}].map((r,i) => (
             <div key={i} style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid #1A2744', borderRadius: '6px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '16px' }}>{r.i}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#C8D8E8', fontSize: '9px', fontWeight: 'bold' }}>{r.n}</div>
                  <div style={{ color: '#4A5568', fontSize: '8px' }}>Asset {i+1}</div>
                </div>
                <div style={{ background: 'transparent', color: r.c, fontSize: '9px', border: \`1px solid \${r.c}\`, padding: '2px 6px', borderRadius: '4px' }}>[{r.s}]</div>
             </div>
           ))}
           <hr style={{ borderColor: '#1A2744', margin: 0 }} />
           <div className="custom-scrollbar" style={{ flex: 1, minHeight: '100px', overflowY: 'auto', color: '#4A5568', fontSize: '9px', fontFamily: 'monospace' }}>
             {logs.map((l, i) => <div key={i}>{l}</div>)}
           </div>
        </div>
      </div>
      
      <div className="panel-border" style={{ background: '#060A10', borderColor: '#2D1A44', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'rgba(6,10,16,0.8)', zIndex: 1000 }}>
          <span style={{ color: '#A78BFA', fontSize: '8px' }}>🗺️ FACILITY SCOUTING MAP — BENGALURU</span>
          <span style={{ color: '#2D4A6B', fontSize: '8px' }}>Overpass API + OSM</span>
        </div>
        <div style={{ flex: 1 }}>
          <MapContainer center={incidentCoords} zoom={13} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={incidentCoords} icon={redAlertIcon}>
               <Popup className="custom-popup">⚠ COLLISION — SENTINEL-001</Popup>
            </Marker>
            {markers.map((m) => (
              <Marker key={m.id} position={m.ll} icon={m.type === 'selected' ? hospSelectedIcon : (m.type === 'hosp' ? hospIcon : (m.type === 'pol' ? policeIcon : fireIcon))}>
                 {m.type === 'selected' && <Popup autoPan={false}>✓ SELECTED: Manipal Hospital<br/>Capability: 9/10<br/>ETA: 13.2 MIN</Popup>}
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', padding: '6px', borderRadius: '4px', fontSize: '8px', zIndex: 1000, color: '#C8D8E8' }}>
          <div><span style={{color:'#EF4444'}}>●</span> INCIDENT</div>
          <div><span style={{color:'#3B82F6'}}>●</span> HOSPITALS {selCard && <span style={{color:'#F59E0B'}}>→ gold (selected)</span>}</div>
          <div><span style={{color:'#A78BFA'}}>●</span> POLICE</div>
          <div><span style={{color:'#F97316'}}>●</span> FIRE</div>
        </div>
      </div>

      <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A44', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2D1A44' }}>
          <span style={{ color: '#A78BFA', fontSize: '8px' }}>🏆 FACILITY RANKING & SELECTION</span>
          <span style={{ color: '#2D4A6B', fontSize: '7px' }}>Ranked by ETA + Capability</span>
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid #1A2744', padding: '8px', fontSize: '8px', color: '#4A5568' }}>
             Ranking factors:<br/>Capability Score (40%)<br/>Estimated ETA via ORS (40%)<br/>Trauma unit availability (20%)
          </div>
          {cards.map((h, i) => {
             const sel = i === 0 && selCard;
             return (
               <div key={i} style={{ borderRadius: '6px', padding: '10px', marginBottom: '6px', border: sel ? '1px solid #F59E0B' : '1px solid #1A2744', background: sel ? 'rgba(247,184,1,0.08)' : 'rgba(26,39,68,0.4)', opacity: (sel || !selCard) ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ background: sel ? '#F59E0B' : '#1A2744', color: 'white', padding: '2px 6px', fontSize: '9px', borderRadius: '4px' }}>#{i+1}</span>
                    {sel && <span style={{ color: '#F59E0B', fontSize: '9px', fontWeight: 'bold' }}>✓ SELECTED</span>}
                  </div>
                  <div style={{ color: '#C8D8E8', fontSize: '10px', fontWeight: 'bold', margin: '4px 0' }}>{h.n}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#4A5568' }}>CAPABILITY <span style={{color: sel?'#F59E0B':'#60A5FA', fontSize:'9px'}}>{"█".repeat(h.c)} {h.c}/10</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#4A5568' }}>ETA VIA ORS <span style={{color: sel?'#F59E0B':'#60A5FA', fontSize:'9px'}}>{h.eta} MIN</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#4A5568' }}>DISTANCE <span style={{color: sel?'#F59E0B':'#60A5FA', fontSize:'9px'}}>{h.dist} KM</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#4A5568' }}>TRAUMA UNIT: <span style={{color: '#22C55E', fontSize:'9px'}}>✓ YES</span></div>
               </div>
             )
          })}
          {selCard && (
             <div style={{ background: 'rgba(247,184,1,0.06)', borderTop: '1px solid #2D1A44', padding: '10px', marginTop: 'auto' }}>
                <div style={{ color: '#4A5568', fontSize: '8px', marginBottom: '4px' }}>SELECTION RATIONALE:</div>
                <div style={{ color: '#8B949E', fontSize: '9px', fontStyle: 'italic' }}>Manipal Hospital selected for superior capability score (9/10) with lowest ETA (13.2 min). Nearest Level 1 Trauma Center to incident. Trauma team pre-alert sent.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AllocationDashboard({ onComplete }) {
  const [logs, setLogs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [positions, setPositions] = useState({});
  const [etas, setEtas] = useState({ amb: "13:12 ▼", fire: "08:45 ▼", pol: "05:20 ▼" });
  
  const incidentCoords = [12.9716, 77.5946];
  const hospCoords = [12.9523, 77.6401];

  const logEndRef = useRef(null);
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const rawLogs = [
      { t: 0, txt: "Allocation Agent activated.", type: "ALLOCATION" },
      { t: 400, txt: "Processing approved triage data...", type: "ALLOCATION" },
      { t: 800, txt: "Incident: SENTINEL-20260403-001", type: "ALLOCATION" },
      { t: 1200, txt: "Severity: CRITICAL | Score: 8/10", type: "ALLOCATION" },
      { t: 1600, txt: "Target: Manipal Hospital confirmed.", type: "ALLOCATION" },
      { t: 2000, txt: "Fetching ORS routes for all units...", type: "ALLOCATION" },
      { t: 2600, txt: "Route 1: EMS depot → ORR → incident", type: "ALLOCATION" },
      { t: 3000, txt: "Route 1: Distance 4.2km | ETA 13.2min", type: "ALLOCATION" },
      { t: 3400, txt: "Route 2: Domlur Fire → incident", type: "ALLOCATION" },
      { t: 3800, txt: "Route 2: Distance 2.1km | ETA 8.7min", type: "ALLOCATION" },
      { t: 4200, txt: "Route 3: HAL Police → incident", type: "ALLOCATION" },
      { t: 4600, txt: "Route 3: Distance 1.8km | ETA 5.3min", type: "ALLOCATION" },
      { t: 5000, txt: "All routes locked via ORS API.", type: "SUCCESS" },
      { t: 5400, txt: "Transmitting orders to units...", type: "DISPATCH" },
      { t: 5800, txt: "KA-01-EMS-247: DISPATCHED ✓", type: "DISPATCH" },
      { t: 6200, txt: "KA-FIRE-07: DISPATCHED ✓", type: "DISPATCH" },
      { t: 6600, txt: "KA-01-PCR-042: DISPATCHED ✓", type: "DISPATCH" },
      { t: 7000, txt: "Hospital pre-alert: SENT ✓", type: "DISPATCH" },
      { t: 7400, txt: "Trauma team: ON STANDBY ✓", type: "DISPATCH" },
      { t: 7800, txt: "Traffic control: NOTIFIED ✓", type: "DISPATCH" },
      { t: 8200, txt: "ALL UNITS EN ROUTE.", type: "SUCCESS" },
      { t: 8600, txt: "Incident logged to MongoDB.", type: "SYSTEM" },
      { t: 9000, txt: "Pipeline complete: 9.0s total", type: "SYSTEM" },
      { t: 9400, txt: "════ MISSION ACTIVE ════", type: "SUCCESS" }
    ];
    let tIds = [];
    rawLogs.forEach(ev => {
      tIds.push(setTimeout(() => setLogs(p => [...p, ev]), ev.t));
    });
    
    // Simulate routes for simplicity and reliability instead of live api fetch which might block execution or have CORS, as noted in the plan text.
    tIds.push(setTimeout(() => {
       setRoutes([
         { id: 'amb', color: '#EF4444', path: [[12.9348, 77.6736], [12.9450, 77.6600], incidentCoords] },
         { id: 'fire', color: '#F59E0B', path: [[12.9612, 77.6391], [12.9650, 77.6000], incidentCoords] },
         { id: 'pol', color: '#A78BFA', path: [[12.9638, 77.6571], [12.9700, 77.6100], incidentCoords] }
       ]);
       // start moving them
       setPositions({ amb: [12.9348, 77.6736], fire: [12.9612, 77.6391], pol: [12.9638, 77.6571] });
    }, 2000));
    
    tIds.push(setTimeout(onComplete, 10000));
    return () => tIds.forEach(clearTimeout);
  }, []);

  const getLogColor = (type) => {
    if (type === 'ALLOCATION') return '#EF4444';
    if (type === 'DISPATCH') return '#A78BFA';
    if (type === 'SYSTEM') return '#4A5568';
    return '#22C55E';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: '8px', padding: '8px', height: '100%', overflow: 'hidden' }}>
       {/* LEFT: DISPATCH ORDERS */}
       <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A1A', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2D1A1A' }}>
             <span style={{ color: '#EF4444', fontSize: '8px' }}>📡 DISPATCH ORDERS</span>
             <span style={{ color: '#2D4A6B', fontSize: '8px' }}>ALLOCATION AGENT</span>
          </div>
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid #2D1A1A', borderRadius: '6px', padding: '10px', fontSize: '9px', color: '#8B949E' }}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>INCIDENT ID:</span><span>SENTINEL-20260403-001</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>SEVERITY:</span><span>CRITICAL (8/10)</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>HOSPITAL:</span><span>Manipal Hospital</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>UNITS:</span><span>3 Dispatched</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>TIME:</span><span>08:30:55</span></div>
             </div>
             {[
               {i:'🚑', cs:'KA-01-EMS-247', t:'Advanced Life Support', f:'Bellandur EMS Station', to:'Manipal Hospital via ORR', eta: etas.amb, c:'#EF4444', tColor: '#22C55E', b:'red'},
               {i:'🚒', cs:'KA-FIRE-07', t:'Hydraulic Rescue Unit', f:'Domlur Fire Station', to:'Incident Site — ORR', eta: etas.fire, c:'#F59E0B', tColor: '#F59E0B', b:'orange'},
               {i:'🚓', cs:'KA-01-PCR-042', t:'Traffic Control Unit', f:'HAL Police Station', to:'Incident Site — ORR', eta: etas.pol, c:'#A78BFA', tColor: '#A78BFA', b:'purple'}
             ].map((u,i) => (
                <div key={i} style={{ borderRadius: '6px', padding: '10px', background: \`rgba(\${i===0?'239,68,68':(i===1?'245,158,11':'167,139,250')}, 0.05)\`, border: \`1px solid rgba(\${i===0?'239,68,68':(i===1?'245,158,11':'167,139,250')}, 0.2)\` }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: '#C8D8E8', fontWeight: 'bold', fontSize: '10px' }}>{u.i} {u.cs}</div>
                      <div style={{ color: u.tColor, border: \`1px solid \${u.tColor}\`, fontSize: '8px', padding: '2px 4px', borderRadius: '2px' }}>[EN ROUTE]</div>
                   </div>
                   <div style={{ color: '#4A5568', fontSize: '8px', margin: '4px 0' }}>{u.t}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                      <span style={{ color: '#4A5568' }}>From</span> <span style={{ color: '#8B949E' }}>{u.f}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                      <span style={{ color: '#4A5568' }}>To</span> <span style={{ color: '#8B949E' }}>{u.to}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ height: '2px', width: '30px', background: u.b }}></div>
                      <span style={{ color: u.tColor, fontSize: '18px', fontWeight: 'bold' }}>{u.eta}</span>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* CENTER: MAP */}
       <div className="panel-border" style={{ background: '#060A10', borderColor: '#2D1A1A', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: 'rgba(6,10,16,0.8)', zIndex: 1000, position:'absolute', top:0, left:0, width:'100%' }}>
             <span style={{ color: '#EF4444', fontSize: '8px' }}>🗺️ LIVE RESPONSE MAP — ROUTING ACTIVE</span>
             <span style={{ color: '#2D4A6B', fontSize: '8px' }}>ORS + OSM</span>
          </div>
          <div style={{ flex: 1 }}>
            <MapContainer center={incidentCoords} zoom={13} style={{ height: '100%', width: '100%', background: '#000' }} zoomControl={false} attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <Marker position={incidentCoords} icon={redAlertIcon} />
              <Marker position={hospCoords} icon={hospSelectedIcon}>
                 <Popup>🏥 Manipal Hospital — TRAUMA READY</Popup>
              </Marker>
              
              {routes.map(r => <Polyline key={r.id} positions={r.path} pathOptions={{ color: r.color, weight: 3, dashArray: '4,4' }} />)}
              <Polyline positions={[incidentCoords, hospCoords]} pathOptions={{ color: '#22C55E', weight: 3, dashArray: '2,6' }} />

              {positions.amb && <Marker position={positions.amb} icon={ambMarker} />}
              {positions.fire && <Marker position={positions.fire} icon={fireMarker} />}
              {positions.pol && <Marker position={positions.pol} icon={polMarker} />}
            </MapContainer>
          </div>
          <div style={{ position: 'absolute', top: '40px', right: '10px', background: 'rgba(0,0,0,0.8)', borderRadius: '6px', padding: '8px 12px', fontSize: '9px', fontFamily: 'monospace', zIndex: 1000, color: 'white', border: '1px solid #1A2744' }}>
             <div style={{ color: '#22C55E' }}>🚑 KA-01-EMS-247   13:10 ETA</div>
             <div style={{ color: '#F59E0B' }}>🚒 KA-FIRE-07       08:40 ETA</div>
             <div style={{ color: '#A78BFA' }}>🚓 KA-01-PCR-042    05:15 ETA</div>
             <div style={{ color: '#22C55E', marginTop: '4px' }}>🏥 Trauma Team: STANDBY</div>
          </div>
       </div>

       {/* RIGHT: LOG */}
       <div className="panel-border" style={{ background: '#0A0F1A', borderColor: '#2D1A1A', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #2D1A1A' }}>
             <span style={{ color: '#EF4444', fontSize: '8px' }}>📋 MISSION EXECUTION LOG</span>
             <span style={{ color: '#22C55E', fontSize: '8px', animation: 'pulseAmber 1.5s infinite' }}>● LIVE</span>
          </div>
          <div className="custom-scrollbar" style={{ flex: 1, padding: '12px', background: '#060A10', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9px', lineHeight: 1.7, display: 'flex', flexDirection: 'column' }}>
             {logs.map((l, i) => (
                <div key={i} style={{ color: getLogColor(l.type), opacity: 0, animation: 'fadeIn 0.5s forwards' }}>
                   {l.type === 'SUCCESS' ? '✓ ' : \`[\${l.type}] \`}
                   {l.txt}
                </div>
             ))}
             <div ref={logEndRef} />
          </div>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '10px', margin: '8px' }}>
             <div style={{ color: '#22C55E', fontSize: '9px', fontWeight: 'bold' }}>🏥 HOSPITAL CONFIRMATION</div>
             <div style={{ color: '#C8D8E8', fontSize: '10px', margin: '4px 0 8px 0' }}>Manipal Hospital Old Airport Road</div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}><span style={{color:'#8B949E'}}>TRAUMA BAY:</span> <span style={{color:'#22C55E'}}>READY</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}><span style={{color:'#8B949E'}}>SURGEONS:</span> <span style={{color:'#22C55E'}}>ALERTED</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}><span style={{color:'#8B949E'}}>BLOOD BANK:</span> <span style={{color:'#F59E0B'}}>STANDBY</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}><span style={{color:'#8B949E'}}>BEDS:</span> <span style={{color:'#22C55E'}}>ALLOCATED</span></div>
          </div>
       </div>
    </div>
  );
}

export { ResourceDashboard, AllocationDashboard };
