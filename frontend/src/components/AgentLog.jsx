import React, { useRef, useEffect } from 'react';

export default function AgentLog({ events = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Group events by category
  const categories = ['DETECTION', 'TRIAGE', 'COORDINATION', 'DISPATCH'];
  
  const groupedEvents = categories.map(cat => ({
    name: cat,
    items: events.filter(e => e.category === cat)
  }));

  // Catch-all for non-categorized logs (like System logs)
  const systemLogs = events.filter(e => !categories.includes(e.category));

  return (
    <div className='flex flex-col h-full bg-[#070d1f]'>
      <div className='p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0'>
        <h2 className='text-[10px] font-black tracking-[0.2em] text-[#84adff] flex items-center gap-2'>
          <span className='w-1.5 h-1.5 bg-[#84adff] rounded-full animate-pulse-live'></span>
          AGENT EXECUTION LOG
        </h2>
      </div>

      <div 
        ref={scrollRef}
        className='flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth'
      >
        {groupedEvents.map((group, idx) => (
          <div key={idx} className={`space-y-3 ${group.items.length === 0 ? 'opacity-20' : 'opacity-100'}`}>
            <h3 className='text-[9px] font-bold text-gray-500 tracking-[0.15em] uppercase border-b border-white/5 pb-1'>
              [{group.name}]
            </h3>
            
            <div className='space-y-4 font-mono'>
              {group.items.map((event, i) => (
                <div key={i} className='animate-slide-in'>
                  <div className='flex items-start gap-3'>
                    <span className='text-[#84adff] text-[10px] font-bold mt-0.5 opacity-50'>{">>>"}</span>
                    <p className='text-[11px] leading-relaxed text-[#dfe4fe]'>
                      {event.text || event.message}
                    </p>
                  </div>
                  {event.image_url && (
                    <div className='mt-3 border border-white/10 p-1 bg-black/40 overflow-hidden'>
                      <img 
                        src={event.image_url} 
                        alt="YOLO Capture" 
                        className='w-full h-auto grayscale brightness-75 hover:grayscale-0 transition-all duration-700' 
                      />
                    </div>
                  )}
                </div>
              ))}
              {group.items.length === 0 && (
                <div className='text-[10px] italic text-gray-700 font-mono'>
                  Waiting for task activation...
                </div>
              )}
            </div>
          </div>
        ))}

        {systemLogs.length > 0 && (
          <div className='space-y-3 pt-4'>
            <h3 className='text-[9px] font-bold text-gray-600 tracking-widest uppercase'>[SYSTEM]</h3>
            <div className='space-y-2 font-mono'>
              {systemLogs.map((event, i) => (
                <div key={i} className='flex items-start gap-3 opacity-60'>
                  <span className='text-gray-600 text-[10px] font-bold mt-0.5'>#</span>
                  <p className='text-[10px] leading-relaxed text-gray-400'>
                    {event.text || event.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
