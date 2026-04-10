import React from 'react';

export default function AlertPanel({ data, triage, status, detection }) {
  const noAccident = status === 'NO_ACCIDENT';
  const uncertain = status === 'UNCERTAIN';
  const isCritical = triage?.severity_score >= 7;

  if (!data && !noAccident) {
    return (
      <div className='bg-[#161B22] border border-[#30363D] rounded-lg p-3 flex flex-col h-full'>
        <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2'>
          Dispatch & Resource Intel
        </div>
        <div className='flex-grow flex items-center justify-center text-gray-600 italic text-sm'>
          Awaiting triage data...
        </div>
      </div>
    );
  }

  if (noAccident) {
    return (
      <div className='bg-[#161B22] border border-green-800 rounded-lg p-3 flex flex-col h-full'>
        <div className='text-sm font-semibold uppercase tracking-wider text-gray-300 mb-2'>
          Dispatch & Resource Intel
        </div>
        <div className='flex-grow flex flex-col items-center justify-center gap-2'>
          <div className='text-4xl'>✅</div>
          <div className='text-green-400 font-bold text-lg tracking-wider'>NO ACCIDENT DETECTED</div>
          <div className='text-gray-400 text-xs text-center'>No emergency response required. Area is clear.</div>
        </div>
      </div>
    );
  }

  const borderColor = isCritical ? 'border-red-700' : uncertain ? 'border-yellow-700' : 'border-orange-700';
  const bgPulse = isCritical ? 'bg-red-900/20' : uncertain ? 'bg-yellow-900/20' : 'bg-orange-900/20';
  const labelColor = isCritical ? 'text-red-400' : uncertain ? 'text-yellow-400' : 'text-orange-400';
  const badgeColor = isCritical ? 'bg-red-600' : uncertain ? 'bg-yellow-600' : 'bg-orange-500';

  const hospital = detection?.selected_hospital;
  const eta = detection?.eta_minutes;
  const dist = detection?.distance_km;
  const specialty = detection?.hospital_specialty;
  const alternatives = detection?.alternatives || [];

  return (
    <div className={`bg-[#161B22] border ${borderColor} rounded-lg p-3 flex flex-col h-full ${bgPulse} overflow-auto`}>
      <div className='flex justify-between items-center mb-2'>
        <span className='text-sm font-semibold uppercase tracking-wider text-gray-300'>
          Dispatch & Resource Intel
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor} text-white`}>
          {status || triage?.severity_label}
        </span>
      </div>

      <div className='space-y-2 text-xs'>
        {/* Incident Type */}
        {detection?.incident_type && (
          <div className='flex items-center gap-2'>
            <span className='text-gray-500 w-24 flex-shrink-0'>Type:</span>
            <span className='text-white font-semibold flex items-center gap-1.5'>
              🔥 {detection.incident_type}
            </span>
          </div>
        )}

        {/* Severity */}
        <div className='flex items-center gap-2'>
          <span className='text-gray-500 w-24 flex-shrink-0'>Severity:</span>
          <span className={`font-bold ${labelColor}`}>
            {triage?.severity_label} ({triage?.severity_score}/10)
          </span>
        </div>

        {/* Services */}
        {data?.services_dispatched?.length > 0 && (
          <div className='flex items-start gap-2'>
            <span className='text-gray-500 w-24 flex-shrink-0'>Dispatched:</span>
            <div className='flex flex-wrap gap-1'>
              {data.services_dispatched.map((s, i) => (
                <span key={i} className='bg-red-900/50 border border-red-700 text-red-300 px-1.5 py-0.5 rounded text-xs'>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hospital from Resource Intelligence */}
        {hospital && (
          <div className='mt-1 p-2 rounded border border-blue-800/60 bg-blue-900/20'>
            <div className='text-blue-400 font-semibold mb-1 flex items-center gap-1'>
              🏥 Resource Intelligence — Best Hospital
            </div>
            <div className='text-white font-bold'>{hospital}</div>
            {specialty && <div className='text-blue-300 mt-0.5'>Specialty: {specialty}</div>}
            <div className='flex gap-4 mt-1 text-gray-300'>
              {eta && <span>⏱ <span className='text-white font-bold'>{eta} min</span></span>}
              {dist && <span>📍 <span className='text-white font-bold'>{dist} km</span></span>}
            </div>
          </div>
        )}

        {/* Alternative hospitals */}
        {alternatives.length > 0 && (
          <div>
            <div className='text-gray-500 mb-1'>Alternatives:</div>
            {alternatives.map((a, i) => (
              <div key={i} className='text-gray-400 flex justify-between'>
                <span>{a.name}</span>
                <span className='text-gray-500'>{a.eta_minutes} min</span>
              </div>
            ))}
          </div>
        )}

        {/* ETA from dispatch */}
        {!hospital && data?.ems_eta_minutes > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-gray-500 w-24 flex-shrink-0'>ETA:</span>
            <span className={`font-bold ${labelColor}`}>{data.ems_eta_minutes} minutes</span>
          </div>
        )}

        {/* Reroute */}
        {data?.reroute_suggestion && (
          <div className='flex items-start gap-2'>
            <span className='text-gray-500 w-24 flex-shrink-0'>Traffic:</span>
            <span className='text-blue-300'>{data.reroute_suggestion}</span>
          </div>
        )}

        {/* Alert message */}
        {data?.alert_message && (
          <div className={`mt-2 p-2 rounded border ${isCritical ? 'border-red-800 bg-red-900/30 text-red-300' : 'border-gray-700 text-gray-300'} font-mono text-xs`}>
            {data.alert_message}
          </div>
        )}

        {uncertain && (
          <div className='mt-1 text-yellow-400 text-xs italic'>
            ⚠ Low confidence — Human verification recommended
          </div>
        )}
      </div>
    </div>
  );
}
