import React, { useState, useEffect, useRef } from 'react';

const SECTORS = [
  { id: 'hebbal', label: 'Hebbal Flyover', lat: 13.0358, lng: 77.5970 },
  { id: 'silkboard', label: 'Silk Board Junction', lat: 12.9176, lng: 77.6233 },
  { id: 'whitefield', label: 'Whitefield Main Rd', lat: 12.9698, lng: 77.7499 },
  { id: 'custom', label: 'Real-time GPS', lat: null, lng: null }
];

export default function MissionConfig({ onStart, isRunning }) {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [useGPS, setUseGPS] = useState(false);
  const [isFetchingGPS, setIsFetchingGPS] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (useGPS) {
      setIsFetchingGPS(true);
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setSelectedSector({
              id: 'custom', 
              label: 'Real-time GPS',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
            setIsFetchingGPS(false);
          },
          (err) => {
            console.error("GPS Error:", err);
            setIsFetchingGPS(false);
            setUseGPS(false);
            const fallback = SECTORS[0];
            setSelectedSector(fallback);
            alert(`GPS Access Denied (${err.message}). Falling back to ${fallback.label}.`);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setIsFetchingGPS(false);
        setUseGPS(false);
        alert("Geolocation is not supported by this browser.");
      }
    }
  }, [useGPS]);

  const handleStart = () => {
    if (isFetchingGPS) return;
    
    if (!videoFile) {
        alert("CRITICAL ERROR: No Tactical Uplink Data Detected. Please upload an incident video to begin mission profiling.");
        return;
    }

    if (selectedSector && selectedSector.lat !== null && selectedSector.lng !== null) {
      onStart({
        lat: selectedSector.lat,
        lng: selectedSector.lng,
        label: selectedSector.label.toUpperCase(),
        videoFile: videoFile
      });
    } else {
      alert(useGPS ? "Scanning GPS Satellites... Please wait for lock." : "Target Sector coordinates invalid.");
    }
  };


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  return (
    <div className='flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-zinc-200/50 shadow-sm'>
      {/* Video Upload Uplink */}
      <div className="flex items-center gap-3 pr-4 border-r border-zinc-100">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="video/*" 
          onChange={handleFileChange} 
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={isRunning}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
            ${videoFile 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-blue-600 text-white shadow-lg shadow-blue-100 animate-pulse'}
          `}
        >
          <span className="text-sm">{videoFile ? '✓' : '⤒'}</span>
          {videoFile ? 'Uplink Established' : 'Establish Tactical Uplink'}
        </button>
        {videoFile && (
          <span className="text-[9px] text-zinc-400 font-bold max-w-[100px] truncate italic">
            {videoFile.name}
          </span>
        )}
      </div>

      {/* Location Vectoring */}
      <div className="flex items-center gap-3 pr-4 border-r border-zinc-100">
        <span className="text-[9px] text-zinc-400 font-black tracking-widest uppercase opacity-60">Vector</span>
        <select 
          disabled={isRunning}
          value={selectedSector.id}
          onChange={(e) => {
            const sector = SECTORS.find(s => s.id === e.target.value);
            if (!sector) return;
            if (sector.id === 'custom') {
              setSelectedSector(sector);
              setUseGPS(true);
            } else {
              setUseGPS(false);
              setSelectedSector(sector);
            }
          }}
          className="bg-transparent text-zinc-900 text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none focus:ring-0"
        >
          {SECTORS.map(s => <option key={s.id} value={s.id} className="bg-white text-zinc-900">{s.label}</option>)}
        </select>
      </div>

      {/* Mission Authorization */}
      <button
        onClick={handleStart}
        disabled={isRunning || isFetchingGPS}
        className={`
          flex items-center gap-3 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.11em] transition-all
          ${(isRunning || isFetchingGPS)
            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
            : (videoFile ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95' : 'bg-zinc-100 text-zinc-300 border border-zinc-200 cursor-not-allowed')}
        `}
      >
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-400 animate-pulse' : (videoFile ? 'bg-white' : 'bg-zinc-300')}`}></div>
        {isRunning ? 'Mission Locked' : (isFetchingGPS ? 'Scanning GPS...' : 'Execute Protocol')}
      </button>

    </div>
  );
}
