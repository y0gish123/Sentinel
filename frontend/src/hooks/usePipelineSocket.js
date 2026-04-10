import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL_STATE = {
  agentEvents: [],
  detection: null,
  triage: null,
  dispatch: null,
  status: null,
  systemStatus: 'IDLE',
  complete: false
};

export function usePipelineSocket() {
  const [pipelineData, setPipelineData] = useState(INITIAL_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    let timeoutId;

    const connectWS = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws/pipeline');

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'log' || data.type === 'event') {
            const msg = data.message;
            let currentStatus = 'MONITORING';
            if (msg.includes('[DETECTION]')) currentStatus = 'SCANNING SECTOR';
            if (msg.includes('[TRIAGE]')) currentStatus = 'ANALYZING SEVERITY';
            if (msg.includes('[RESOURCE]')) currentStatus = 'ROUTING RESOURCES';
            if (msg.includes('[DISPATCH]')) currentStatus = 'DISPATCHING UNITS';
            if (msg.includes('SENTINEL ALERT')) currentStatus = 'ACTIVE RESPONSE';

            setPipelineData(prev => {
              const lastEvent = prev.agentEvents[prev.agentEvents.length - 1];
              if (lastEvent && lastEvent.text === data.message) return prev;
              return {
                ...prev,
                systemStatus: currentStatus,
                detection: data.image_url ? { ...prev.detection, snapshot_url: data.image_url } : prev.detection,
                agentEvents: [...prev.agentEvents, {
                  time: new Date().toLocaleTimeString([], { hour12: false }),
                  text: data.message
                }]
              };
            });

          } else if (data.type === 'triage_complete') {
            setPipelineData(prev => ({
              ...prev,
              triage: {
                severity_score: data.data.severity_score,
                severity_label: data.data.severity_label,
                triage_reasoning: data.data.triage_reasoning
              }
            }));

          } else if (data.type === 'result') {
            const r = data.data;
            setPipelineData(prev => ({
              ...prev,
              status: r.status,
              detection: {
                crash_detected: r.crash_detected,
                confidence: r.confidence,
                vehicles_detected: r.vehicles_detected,
                frame_number: r.frame_number,
                gps_coordinates: r.gps_coordinates,
                timestamp: r.timestamp,
                snapshot_url: r.snapshot_url || prev.detection?.snapshot_url,
                incident_type: r.incident_type || null,
                // Resource Intelligence routing data
                route_geometry: r.route_geometry || [],
                selected_hospital: r.selected_hospital || null,
                hospital_lat: r.hospital_lat || null,
                hospital_lng: r.hospital_lng || null,
                hospital_specialty: r.hospital_specialty || null,
                eta_minutes: r.eta_minutes || null,
                distance_km: r.distance_km || null,
                alternatives: r.alternatives || [],
                resource_reasoning: r.resource_reasoning || null,
                confidence_score: r.confidence_score || 0.9,
                // Multi-Agency fields
                selected_police: r.selected_police || null,
                police_lat: r.police_lat || null,
                police_lng: r.police_lng || null,
                selected_fire: r.selected_fire || null,
                fire_lat: r.fire_lat || null,
                fire_lng: r.fire_lng || null,
              },
              triage: r.crash_detected ? {
                severity_score: r.severity_score,
                severity_label: r.severity_label,
                triage_reasoning: r.triage_reasoning
              } : null,
              dispatch: r.crash_detected ? {
                services_dispatched: r.services_dispatched,
                ems_eta_minutes: r.ems_eta_minutes,
                alert_message: r.alert_message,
                hospital_notified: r.hospital_notified,
                hospital_message: r.hospital_message,
                reroute_suggestion: r.reroute_suggestion,
                incident_id: r.incident_id
              } : null,
              complete: true
            }));
            setIsRunning(false);
            if (timeoutId) clearTimeout(timeoutId);


          } else if (data.type === 'error') {
            setPipelineData(prev => {
              const lastEvent = prev.agentEvents[prev.agentEvents.length - 1];
              if (lastEvent && lastEvent.text === `❌ ${data.message}`) return prev;
              return {
                ...prev,
                agentEvents: [...prev.agentEvents, {
                  time: new Date().toLocaleTimeString(),
                  text: `❌ ${data.message}`
                }]
              };
            });
            setIsRunning(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
        } catch {
          setPipelineData(prev => ({
            ...prev,
            agentEvents: [...prev.agentEvents, {
              time: new Date().toLocaleTimeString(),
              text: event.data
            }]
          }));
        }
      };

      ws.current.onerror = () => {
        setIsRunning(false);
      };

      ws.current.onclose = () => {
        setIsRunning(false);
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();
    return () => {
      if (ws.current) ws.current.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const triggerPipeline = useCallback(async (endpoint = '/api/start', options = {}) => {
    setIsRunning(true);
    setPipelineData({
      ...INITIAL_STATE,
      systemStatus: 'INITIALIZING',
      agentEvents: [{ time: new Date().toLocaleTimeString([], { hour12: false }), text: '🚀 Starting SENTINEL Pipeline...' }]
    });

    // Safety timeout: Reset isRunning if no result in 60s
    const tid = setTimeout(() => {
      setIsRunning(current => {
        if (current) {
          setPipelineData(prev => ({
            ...prev,
            agentEvents: [...prev.agentEvents, {
              time: new Date().toLocaleTimeString(),
              text: '⚠ Pipeline timeout — Resetting status.'
            }]
          }));
        }
        return false;
      });
    }, 90000);

    try {
      const resp = await fetch(`http://localhost:8000${endpoint}`, { method: 'POST', ...options });
      if (!resp.ok) throw new Error('Backend server error (HTTP ' + resp.status + ')');
      
      const data = await resp.json();
      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown backend error');
      }
    } catch (err) {
      clearTimeout(tid);
      setPipelineData(prev => ({
        ...prev,
        agentEvents: [...prev.agentEvents, {
          time: new Date().toLocaleTimeString(),
          text: `❌ ${err.message}`
        }]
      }));
      setIsRunning(false);
    }
  }, []);

  const uploadAndAnalyze = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await triggerPipeline('/api/upload-video', { body: formData });
  }, [triggerPipeline]);

  return { pipelineData, triggerPipeline, uploadAndAnalyze, isRunning };
}
