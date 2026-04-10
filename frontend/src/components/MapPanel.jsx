import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPanel({ detection, dispatch, isRunning, missionLat, missionLng }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [map, setMap] = useState(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (map && missionLat && missionLng) {
      map.flyTo([missionLat, missionLng], 14, { duration: 2 });
    }
  }, [map, missionLat, missionLng]);

  const accidentPos = detection?.crash_detected ? [detection.lat || missionLat || 12.9716, detection.lng || missionLng || 77.5946] : [missionLat || 12.9716, missionLng || 77.5946];
  const hasCrash = detection?.crash_detected;
  const routeGeometry = detection?.route_geometry || [];
  const hospitalPos = (detection?.hospital_lat != null && detection?.hospital_lng != null) ? [detection.hospital_lat, detection.hospital_lng] : null;
  const policePos = (detection?.police_lat != null && detection?.police_lng != null) ? [detection.police_lat, detection.police_lng] : null;
  const firePos = (detection?.fire_lat != null && detection?.fire_lng != null) ? [detection.fire_lat, detection.fire_lng] : null;

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(accidentPos, 13);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { 
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }
    ).addTo(map);

    mapInstanceRef.current = map;
    setMap(map);

    // Fix map tile fragmentation after potential CSS transitions
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Icon SVGs
    const hospitalSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 11h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2"/>
        <path d="M9 11V9a3 3 0 0 1 6 0v2"/>
        <path d="M12 14v4"/><path d="M10 16h4"/>
      </svg>`;
    
    const policeSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#1E40AF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>`;
    
    const fireSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>`;
    
    const alertSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>`;

    // 1. Accident Marker
    const accidentIcon = L.divIcon({
      className: 'custom-tactical-icon',
      html: `<div class="marker-alert">${alertSVG}</div>`,
      iconAnchor: [20, 20],
    });
    const accidentMarker = L.marker(accidentPos, { icon: accidentIcon })
      .addTo(map)
      .bindPopup('<b class="text-red-700 font-bold">🚨 CRITICAL INCIDENT</b><br>' + (detection?.gps_coordinates || ''));
    markersRef.current.push(accidentMarker);

    // 2. Agency Markers
    if (hospitalPos) {
      const hospitalIcon = L.divIcon({
        className: 'custom-tactical-icon',
        html: `<div class="marker-hospital">${hospitalSVG}</div>`,
        iconAnchor: [18, 18],
      });
      const hospitalMarker = L.marker(hospitalPos, { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<b class="text-blue-700">${detection.selected_hospital || 'Medical Asset'}</b><br>ETA: ${detection.eta_minutes ?? '--'} min`);
      markersRef.current.push(hospitalMarker);
    }

    if (policePos) {
      const policeIcon = L.divIcon({
        className: 'custom-tactical-icon',
        html: `<div class="marker-police">${policeSVG}</div>`,
        iconAnchor: [18, 18],
      });
      const policeMarker = L.marker(policePos, { icon: policeIcon })
        .addTo(map)
        .bindPopup(`<b class="text-blue-900">${detection.selected_police || 'Police Unit'}</b><br>Public Safety En Route`);
      markersRef.current.push(policeMarker);
    }

    if (firePos) {
      const fireIcon = L.divIcon({
        className: 'custom-tactical-icon',
        html: `<div class="marker-fire">${fireSVG}</div>`,
        iconAnchor: [18, 18],
      });
      const fireMarker = L.marker(firePos, { icon: fireIcon })
        .addTo(map)
        .bindPopup(`<b class="text-red-600">${detection.selected_fire || 'Fire Unit'}</b><br>Rescue Operation Active`);
      markersRef.current.push(fireMarker);
    }

    // 3. Draw Route
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    if (routeGeometry.length > 0) {
      routeLayerRef.current = L.polyline(routeGeometry, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.6,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(map);

      const bounds = L.latLngBounds([
        accidentPos,
        ...(hospitalPos ? [hospitalPos] : []),
        ...(policePos ? [policePos] : []),
        ...(firePos ? [firePos] : []),
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else {
      map.setView(accidentPos, 14);
    }
  }, [hasCrash, routeGeometry, hospitalPos, accidentPos, policePos, firePos]);

  return (
    <div className='w-full h-full relative overflow-hidden bg-[#F1F5F9]'>
      <div ref={mapRef} className='w-full h-full' />
      
      {/* Legend (Clean Tactical) */}
      <div className='absolute bottom-4 right-4 z-[1000]'>
        <div className='bg-white shadow-xl border border-zinc-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-4 rounded-full'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-blue-600'></div>
            <span>Tactical Feed</span>
          </div>
          <div className='w-px h-3 bg-zinc-200'></div>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-zinc-300 animate-pulse'></div>
            <span>Mission Active</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-div-icon { background: transparent !important; border: none !important; }
        .custom-tactical-icon { display: flex; align-items: center; justify-content: center; }
        
        .marker-alert { width: 40px; height: 40px; background: white; border: 2px solid #EF4444; border-radius: 8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; padding: 6px; }
        .marker-hospital { width: 36px; height: 36px; background: white; border: 2px solid #2563EB; border-radius: 50%; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); display: flex; align-items: center; justify-content: center; padding: 6px; }
        .marker-police { width: 36px; height: 36px; background: white; border: 2px solid #1E40AF; border-radius: 50%; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2); display: flex; align-items: center; justify-content: center; padding: 6px; }
        .marker-fire { width: 36px; height: 36px; background: white; border: 2px solid #DC2626; border-radius: 50%; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); display: flex; align-items: center; justify-content: center; padding: 6px; }
        
        .leaflet-popup-content-wrapper { border-radius: 8px; font-family: inherit; }
        .leaflet-popup-tip { background: white; }
      `}} />
    </div>
  );
}
