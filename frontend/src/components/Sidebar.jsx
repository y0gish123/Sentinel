import React from 'react';

export default function Sidebar({ data }) {
  const hasData = data.crash_detected;
  
  const agencies = [
    { 
      id: 'medical', 
      name: 'Medical Asset', 
      value: data.selected_hospital || 'SCANNIG...', 
      status: data.selected_hospital ? 'DISPATCHED' : 'PENDING',
      eta: data.eta_minutes,
      color: '#3B82F6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M16 11h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2"/>
          <path d="M9 11V9a3 3 0 0 1 6 0v2"/>
          <path d="M12 14v4M10 16h4"/>
        </svg>
      )
    },
    { 
      id: 'police', 
      name: 'Law Enforcement', 
      value: data.selected_police || 'ANALYZING...', 
      status: data.selected_police ? 'EN ROUTE' : 'PENDING',
      color: '#1E40AF',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <circle cx="12" cy="11" r="3"/>
        </svg>
      )
    },
    { 
      id: 'fire', 
      name: 'Rescue Engine', 
      value: data.selected_fire || 'PENDING ASSIGNMENT', 
      status: data.selected_fire ? 'DISPATCHED' : 'STANDBY',
      color: '#DC2626',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      )
    }
  ];

  return (
    <aside className="w-72 border-r border-zinc-200 bg-white flex flex-col z-20">
      <div className="p-6 border-bottom border-zinc-100">
        <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[.3em]">Agency Status</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {agencies.map((agency) => (
          <div key={agency.id} className="group p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-zinc-300 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white shadow-sm text-zinc-600" style={{ color: agency.color }}>
                {agency.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{agency.name}</span>
                <span className={`text-[9px] font-black tracking-widest ${agency.status === 'PENDING' ? 'text-zinc-400' : ''}`} style={{ color: agency.status !== 'PENDING' ? agency.color : undefined }}>
                  {agency.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-zinc-800 line-clamp-1">{agency.value}</div>
              {agency.eta && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-blue-600">{agency.eta} min ETA</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-zinc-50 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Mission Progress</span>
          <span className="text-[10px] font-black text-zinc-800 tracking-tighter">
            {hasData ? 'ACTIVE' : 'READY'}
          </span>
        </div>
        <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-1000" 
            style={{ width: hasData ? '100%' : '0%' }}
          ></div>
        </div>
      </div>
    </aside>
  );
}
