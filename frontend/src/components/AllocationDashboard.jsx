import React, { useState, useEffect } from 'react';
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

const VehicleMarker = ({ position, icon, label, color }) => {
  const customIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative group">
        <div style="background-color: ${color}; width: 32px; height: 32px;" class="rounded-xl flex items-center justify-center text-lg border-2 border-white shadow-lg transform rotate-45">
          <div class="-rotate-45">${icon}</div>
        </div>
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-2 py-0.5 rounded border border-zinc-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <span class="text-[9px] font-black text-zinc-800 tracking-widest">${label}</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup permanent>
        <div className="text-[10px] font-black tracking-widest text-zinc-800">{label}</div>
      </Popup>
    </Marker>
  );
};

function MapController({ incident }) {
  const map = useMap();
  useEffect(() => {
    map.setView(incident, 14);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [incident, map]);
  return null;
}

export default function AllocationDashboard({ data, logs, active }) {
  const result = data || {};
  const [timeElapsed, setTimeElapsed] = useState(0);
  const incidentCoords = [result.lat || 13.0358, result.lng || 77.5970];
  const hospCoords = [result.hospital_lat, result.hospital_lng];

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 0.1);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [active]);

  const getDynamicETA = (baseEta) => {
    if (!baseEta) return '...';
    const val = baseEta - timeElapsed;
    return val > 0 ? val.toFixed(1) : '0.0';
  };

  const dispatchOrders = [];
  if (result.selected_hospital) {
    dispatchOrders.push({ type: 'EMS', id: 'UNIT-BRAVO', icon: '🚑', from: result.selected_hospital, status: 'EN ROUTE', color: '#10B981', eta: getDynamicETA(result.eta_minutes) });
  }
  if (result.selected_fire && result.selected_fire !== "N/A") {
    dispatchOrders.push({ type: 'FIRE', id: 'UNIT-ALPHA', icon: '🚒', from: result.selected_fire, status: 'EN ROUTE', color: '#F59E0B', eta: getDynamicETA(result.eta_minutes * 1.1) });
  }
  if (result.selected_police && result.selected_police !== "N/A") {
    dispatchOrders.push({ type: 'POLICE', id: 'UNIT-ZULU', icon: '🚔', from: result.selected_police, status: 'EN ROUTE', color: '#8B5CF6', eta: getDynamicETA(result.eta_minutes * 0.6) });
  }

  return (
    <div className={`grid grid-cols-[340px_1fr_360px] gap-6 p-6 h-full transition-all duration-500 overflow-hidden ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* LEFT PANEL: DISPATCH ORDERS */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <span className="text-[10px] font-black text-red-600 tracking-[0.2em] uppercase">Active Deployment</span>
        </div>
        
        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           <div className="bg-red-50/30 border border-red-100 p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between text-[9px] font-black text-red-400 uppercase tracking-widest">
                 <span>Mission Locking</span>
                 <span>P1 Response</span>
              </div>
              <span className="text-xl font-black text-zinc-900 tracking-tight">{result.incident_id || 'SENTINEL-ALPHA-01'}</span>
              <div className="grid grid-cols-2 gap-6 mt-2 border-t border-red-100 pt-4">
                 <div>
                    <span className="text-[9px] text-zinc-400 font-bold block mb-1">Target Facility</span>
                    <span className="text-[11px] font-black text-zinc-800 leading-tight">{result.selected_hospital}</span>
                 </div>
                 <div>
                    <span className="text-[9px] text-zinc-400 font-bold block mb-1">Uplink Lock</span>
                    <span className="text-[11px] font-black text-emerald-600">VERIFIED</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4">
              {dispatchOrders.map((order) => (
                <div key={order.id} className="p-5 bg-white border border-zinc-100 rounded-2xl flex flex-col gap-4 hover:border-red-200 hover:shadow-sm transition-all group">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-xl border border-zinc-100 group-hover:bg-white transition-colors">
                           {order.icon}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-zinc-800 tracking-tight">{order.id}</span>
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Mobile Asset</span>
                         </div>
                      </div>
                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 tracking-widest">{order.status}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: order.color }}>{order.type} Response Unit</span>
                      <span className="text-[9px] text-zinc-400 font-medium">Station Offset: {order.from}</span>
                   </div>
                   <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Final Arrival</span>
                      <span className="text-sm font-black tracking-widest text-zinc-900">{order.eta} MIN</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* CENTER PANEL: INTERACTIVE RESPONSE MAP */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
         <MapContainer center={incidentCoords} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Marker position={incidentCoords}>
               <Popup permanent><div className="text-red-700 font-black text-[10px] tracking-widest">GROUND ZERO</div></Popup>
            </Marker>
            
            {hospCoords && hospCoords[0] && (
               <Marker position={hospCoords}>
                  <Popup permanent><div className="text-blue-700 font-black text-[10px] tracking-widest uppercase">Target Hub</div></Popup>
               </Marker>
            )}

            {result.route_geometry && (
               <Polyline positions={result.route_geometry} pathOptions={{ color: '#EF4444', weight: 4, opacity: 0.5, dashArray: '8, 12' }} />
            )}

            <VehicleMarker position={[incidentCoords[0] + 0.005, incidentCoords[1] - 0.008]} icon="🚑" label="EMS-UNIT-01" color="#10B981" />
            <VehicleMarker position={[incidentCoords[0] - 0.004, incidentCoords[1] + 0.003]} icon="🚒" label="FIRE-SUPPRESS-A" color="#F59E0B" />
            <VehicleMarker position={[incidentCoords[0] + 0.003, incidentCoords[1] + 0.006]} icon="🚔" label="PCR-ALPHA" color="#8B5CF6" />
            
            <MapController incident={incidentCoords} />
         </MapContainer>

         <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-4 border border-zinc-200 rounded-2xl shadow-xl flex flex-col gap-4 min-w-[200px]">
             <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase border-b border-zinc-100 pb-2">Telemetry Uplink</span>
             <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-900 font-black leading-none mb-1">GPS SYNCHRONIZED</span>
                      <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight">Accuracy: ±0.8m</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-900 font-black leading-none mb-1">HOSPITAL READY</span>
                      <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-tight">Trauma Bay Assigned</span>
                   </div>
                </div>
             </div>
         </div>
      </div>

      {/* RIGHT PANEL: MISSION CHRONOLOGY */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <span className="text-[10px] font-black text-red-600 tracking-[0.2em] uppercase">Mission Chronology</span>
        </div>
        
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 font-sans">
              {logs.filter(l => l.category === 'DISPATCH' || l.category === 'ALLOCATION').map((log, i) => (
                <div key={i} className="flex gap-4 group">
                   <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${log.category === 'DISPATCH' ? 'bg-red-500 shadow-lg shadow-red-100' : 'bg-blue-500 shadow-lg shadow-blue-100'}`}></div>
                      <div className="flex-1 w-px bg-zinc-100 group-last:hidden"></div>
                   </div>
                   <div className="flex flex-col pb-6">
                      <span className={`text-[10px] font-black tracking-widest uppercase mb-1 ${log.category === 'DISPATCH' ? 'text-red-600' : 'text-blue-600'}`}>
                        {log.category}
                      </span>
                      <span className="text-xs text-zinc-600 font-medium leading-relaxed">{log.message}</span>
                      <span className="text-[8px] text-zinc-400 font-bold mt-2 uppercase tracking-tight">{log.time || log.timestamp || 'T+0'}</span>
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-emerald-600 rounded-2xl p-6 shadow-xl shadow-emerald-50 text-white relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                 </svg>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                 <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70">Facility Confirmation</span>
                 <span className="text-lg font-black tracking-tight leading-tight uppercase">{result.selected_hospital}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                 {[
                   { label: 'Trauma Bay', status: 'LOCKED' },
                   { label: 'Surgical Team', status: 'READY' },
                   { label: 'Path Clearance', status: 'GRANTED' },
                   { label: 'Uplink Integrity', status: '100%' }
                 ].map((s, i) => (
                   <div key={i} className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase opacity-60 mb-0.5">{s.label}</span>
                      <span className="text-[10px] font-black tracking-widest">{s.status}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
