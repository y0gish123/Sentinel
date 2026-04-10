import React, { useRef } from 'react';

export default function VideoPanel({ data, isRunning, onUpload }) {
  const fileInputRef = useRef(null);
  const { detections = [], image_url } = data || {};

  return (
    <div className='flex flex-col h-full bg-[#070d1f]'>
      <div className='p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-red-500 animate-pulse'></span>
          <h2 className='text-[10px] font-black tracking-[0.2em] text-[#84adff] font-tactical'>
            ● LIVE FEED
          </h2>
        </div>
        <div className='text-[8px] font-mono text-gray-600'>SECURE_SAT_LINK</div>
      </div>

      <div className='flex-grow relative bg-black/40 flex items-center justify-center p-4 overflow-hidden'>
        {/* Placeholder or Upload View */}
        {!isRunning && !image_url && (
          <div className='text-center space-y-6'>
            <div className='text-[10px] font-black tracking-[0.2em] text-[#84adff] opacity-40 uppercase'>
              Awaiting Tactical Uplink
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className='px-8 py-3 bg-[#84adff]/5 border border-[#84adff]/20 text-[10px] font-black tracking-widest uppercase hover:bg-[#84adff]/10 transition-all text-[#84adff]'
            >
              Initialize Feed
            </button>
            <input 
              type='file' 
              ref={fileInputRef} 
              className='hidden' 
              onChange={onUpload} 
              accept='video/*' 
            />
          </div>
        )}

        {/* Real-time Video/Image with Bounding Boxes */}
        {image_url && (
          <div className='relative max-w-full max-h-full'>
            <img 
              src={image_url} 
              alt="Live Feed" 
              className='block max-w-full max-h-full border border-white/5 shadow-2xl grayscale brightness-110' 
            />
            
            {/* YOLO Bounding Boxes */}
            <div className='absolute inset-0 pointer-events-none'>
              {detections.map((det, i) => (
                <div 
                  key={i}
                  style={{
                    left: `${det.bbox[0]*100}%`,
                    top: `${det.bbox[1]*100}%`,
                    width: `${(det.bbox[2]-det.bbox[0])*100}%`,
                    height: `${(det.bbox[3]-det.bbox[1])*100}%`,
                    borderWidth: '2px',
                    borderColor: det.label === 'car' ? '#84adff' : '#ff716c',
                    position: 'absolute'
                  }}
                >
                  <div className='bg-black/80 text-[8px] font-black px-1 py-0.5 absolute -top-5 left-0 text-white uppercase tracking-tighter'>
                    {det.label} {Math.round(det.conf * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Optical Scanning Line (Minimalist) */}
        {isRunning && (
           <div className='absolute left-0 right-0 h-[1px] bg-[#84adff]/10 animate-scan pointer-events-none' style={{ animation: 'scan 4s linear infinite' }}></div>
        )}
      </div>

      <div className='p-4 border-t border-white/5 opacity-30'>
        <div className='text-[8px] font-mono text-blue-400 uppercase tracking-widest text-right'>
          Status: Operational / Sub-Zero Latency
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
