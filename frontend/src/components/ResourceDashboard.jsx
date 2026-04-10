import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapController({ incident, markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds([incident, ...markers.map(m => m.ll)]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.setView(incident, 14);
    }
    
    // Fix map tile fragmentation after CSS transitions
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [incident, markers, map]);
  return null;
}

export default function ResourceDashboard({ data, logs, active }) {
  const result = data || {};
  const incidentCoords = [result.lat || 13.0358, result.lng || 77.5970];
  const [visibleHospitals, setVisibleHospitals] = useState([]);

  useEffect(() => {
    const candidates = result.hospital_candidates || result.alternatives || [];
    const timeouts = [];

    if (active && candidates.length > 0) {
      setVisibleHospitals([]);
      candidates.forEach((h, i) => {
        const id = setTimeout(() => {
          setVisibleHospitals(prev => {
            // Check for duplication based on name before appending
            if (prev.some(existing => existing.name === h.name)) return prev;
            return [...prev, h];
          });
        }, i * 150);
        timeouts.push(id);
      });
    }
    
    return () => timeouts.forEach(clearTimeout);
  }, [active, result.hospital_candidates, result.alternatives]);

  const markers = [
    { type: 'selected', ll: [result.hospital_lat, result.hospital_lng], name: result.selected_hospital, color: '#A78BFA' },
    { type: 'pol', ll: [result.police_lat, result.police_lng], name: result.selected_police, color: '#60A5FA' },
    { type: 'fire', ll: [result.fire_lat, result.fire_lng], name: result.selected_fire, color: '#F59E0B' }
  ].filter(m => m.ll && m.ll[0] && m.ll[1]);

  const requirements = [
    { label: 'ALS Ambulance', unit: '1 Unit', status: 'REQUIRED', color: '#EF4444' },
    { label: 'Hydraulic Rescue', unit: '1 Unit', status: 'REQUIRED', color: '#EF4444' },
    { label: 'Traffic Control', unit: '1 Unit', status: 'REQUIRED', color: '#EF4444' },
    { label: 'Level 1 Trauma Center', unit: '1 Unit', status: 'SELECTED', color: '#10B981' }
  ];

  return (
    <div className={`grid grid-cols-[300px_1fr_360px] gap-6 p-6 h-full transition-all duration-500 overflow-hidden ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* LEFT PANEL: RESOURCE REQUIREMENTS */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Resource Requirements</span>
        </div>
        
        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
            <span className="text-[9px] text-blue-600 font-black block mb-2 uppercase tracking-widest">Mission Profile</span>
            <div className="flex flex-col gap-1 text-[10px] text-zinc-600 font-bold">
              <div className="flex justify-between"><span>Severity Score:</span> <span className="text-zinc-900">{result.severity_score || '0'}/10</span></div>
              <div className="flex justify-between"><span>Vehicle Impact:</span> <span className="text-zinc-900">{result.vehicles_detected || '0'} Units</span></div>
              <div className="flex justify-between"><span>Tactical Urgency:</span> <span className="text-red-600">CRITICAL</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[11px] font-black text-zinc-800">{req.label}</span>
                   <span className="text-[9px] text-zinc-400 font-bold uppercase">{req.unit}</span>
                </div>
                <div className={`text-[8px] font-black tracking-widest px-2 py-1 rounded-md`} style={{ color: req.color, backgroundColor: `${req.color}10`, border: `1px solid ${req.color}30` }}>
                   {req.status}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-100">
             <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase block mb-4">Command Terminal Log</span>
             <div className="flex flex-col gap-2 font-mono text-[9px] text-zinc-500">
                {logs.filter(l => l.category === 'COORDINATION' || l.category === 'SYSTEM').slice(-5).map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-blue-500 font-black">❯</span>
                    <span className="leading-tight">{l.message}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: TACTICAL ASSETS MAP */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
        <MapContainer center={incidentCoords} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; CARTO &copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={incidentCoords}>
            <Popup permanent>
              <div className="text-[10px] font-black text-red-600">INCIDENT SITE</div>
            </Popup>
          </Marker>

          {markers.map((m, i) => (
            <Marker key={i} position={m.ll}>
              <Popup permanent>
                <div className="text-[10px] font-black text-zinc-800">{m.name.toUpperCase()}</div>
              </Popup>
            </Marker>
          ))}

          {result.route_geometry && result.route_geometry.length > 0 && (
            <Polyline 
              positions={result.route_geometry} 
              pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.6, dashArray: '8, 8' }} 
            />
          )}

          <MapController incident={incidentCoords} markers={markers} />
        </MapContainer>
        
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 border border-zinc-200 rounded-full shadow-lg">
           <span className="text-[9px] font-black tracking-[0.2em] text-blue-600 uppercase flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             ORS Network Active
           </span>
        </div>
      </div>

      {/* RIGHT PANEL: FACILITY RANKING */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col gap-1 bg-zinc-50/50">
          <span className="text-[10px] font-black text-zinc-800 tracking-widest uppercase">Facility Intelligence</span>
          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Optimized Asset Allocation</span>
        </div>
        
        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3">
             {visibleHospitals.map((h, i) => {
               const isSelected = h.name === result.selected_hospital;
               return (
                 <div key={i} className={`p-5 rounded-2xl border transition-all duration-500 transform ${isSelected ? 'border-emerald-200 bg-emerald-50/30 scale-[1.02] shadow-sm' : 'border-zinc-100 bg-zinc-50/30 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex flex-col">
                          <span className={`text-[11px] font-black tracking-wide ${isSelected ? 'text-emerald-700' : 'text-zinc-800'}`}>{i + 1}. {h.name}</span>
                          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Scouted Option</span>
                       </div>
                       {isSelected && (
                         <div className="bg-emerald-500 text-white p-1 rounded-full">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-3 h-3">
                             <polyline points="20 6 9 17 4 12" />
                           </svg>
                         </div>
                       )}
                    </div>
                    
                    <div className="flex flex-col gap-2 mb-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Capability Alpha</span>
                          <span className="text-[10px] font-black text-zinc-900">{h.capability_rank || 8}/10</span>
                       </div>
                       <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div className={`h-full ${isSelected ? 'bg-emerald-500' : 'bg-blue-400'} transition-all duration-1000`} style={{ width: `${(h.capability_rank || 8) * 10}%` }} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-white p-3 rounded-xl border border-zinc-100">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-1">ETA Path</span>
                          <span className="text-xs font-black text-zinc-900">{h.eta_minutes} MIN</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-1">Distance</span>
                          <span className="text-xs font-black text-zinc-900">{h.distance_km} KM</span>
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>

          <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl italic text-[10px] text-zinc-400 leading-relaxed text-center">
            Mission parameters optimized via Gemini Strategic Reasoning Engine and OSRM Tactical Analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
