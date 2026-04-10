import React from 'react';

export default function IncidentReport({ data }) {
  // Safe destructuring with null/undefined protection
  const detection = data?.detection || {};
  const triage = data?.triage || {};
  const dispatch = data?.dispatch || {};

  // Extract nested fields
  const timestamp = detection.timestamp;
  const incident_id = dispatch.incident_id;
  const incident_type = detection.incident_type;
  
  if (!detection.crash_detected && !triage.severity_label) {
    return (
      <div className='p-8 h-full flex items-center justify-center bg-[#070d1f] opacity-20'>
        <div className='text-[10px] font-black tracking-[0.3em] uppercase animate-pulse'>
          Awaiting Sensor Data...
        </div>
      </div>
    );
  }

  const severityColor = triage.severity_label === 'CRITICAL' ? 'text-red-500' : (triage.severity_label === 'MODERATE' ? 'text-orange-400' : 'text-blue-400');
  const typeText = incident_type || (detection.crash_detected ? 'VEHICULAR_COLLISION' : 'SEARCHING...');

  return (
    <div className='p-8 h-full flex flex-col bg-[#070d1f]'>
      <div className='flex items-center justify-between mb-8 flex-shrink-0'>
        <h2 className='text-[11px] font-black tracking-[0.2em] text-[#84adff] flex items-center gap-2'>
          <span className='w-1.5 h-1.5 bg-[#84adff] rounded-full'></span>
          INCIDENT REPORT
        </h2>
        <div className='text-[10px] font-mono text-gray-600 tracking-widest'>SECURE_DATA_LINK</div>
      </div>

      <div className='grid grid-cols-2 gap-y-8 gap-x-12 flex-grow'>
        <div className='space-y-1.5'>
          <div className='text-[9px] font-bold text-gray-500 tracking-widest uppercase'>Severity</div>
          <div className={`text-sm font-black font-tactical ${severityColor}`}>
            {triage.severity_label || '--'} ({triage.severity_score || '0'}/10)
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='text-[9px] font-bold text-gray-500 tracking-widest uppercase'>Confidence</div>
          <div className='text-sm font-black font-tactical text-white'>
            {detection.confidence != null ? `${(detection.confidence * 100).toFixed(0)}%` : '--'}
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='text-[9px] font-bold text-gray-500 tracking-widest uppercase'>Incident ID</div>
          <div className='text-xs font-mono font-bold text-gray-300'>
            {incident_id || 'SR-0000'}
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='text-[9px] font-bold text-gray-500 tracking-widest uppercase'>Timestamp</div>
          <div className='text-xs font-mono font-bold text-gray-300'>
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour12: false }) : '--:--:--'}
          </div>
        </div>

        <div className='col-span-2 space-y-1.5'>
          <div className='text-[9px] font-bold text-gray-500 tracking-widest uppercase'>Incident Type</div>
          <div className='text-xs font-black font-tactical text-white tracking-widest'>
            {typeText}
          </div>
        </div>
      </div>

      <div className='pt-6 mt-auto border-t border-white/5 opacity-30'>
        <div className='text-[8px] font-mono text-blue-400 uppercase tracking-widest'>Encryption: 256-BIT_SECURE</div>
      </div>
    </div>
  );
}
