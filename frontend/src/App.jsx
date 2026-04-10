import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import PipelineNavigator from './components/PipelineNavigator';
import StatusBar from './components/StatusBar';
import DetectionDashboard from './components/DetectionDashboard';
import TriageDashboard from './components/TriageDashboard';
import ResourceDashboard from './components/ResourceDashboard';
import AllocationDashboard from './components/AllocationDashboard';
import Sidebar from './components/Sidebar';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
const getApiUrl = (path) => `${API_BASE}${path}`;

export default function App() {
  const [pipelineState, setPipelineState] = useState({ status: 'idle', activeAgent: null, completedAgents: [], missionId: null });
  const [manualActiveAgent, setManualActiveAgent] = useState(null);
  const [incidentData, setIncidentData] = useState({});
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [missionKey, setMissionKey] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  // Derive which agent to show: manually selected or currently active in pipeline
  const activeViewAgent = manualActiveAgent || pipelineState.activeAgent;

  // --- WEBSOCKET CONNECTION ---
  const connectWS = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
    }
    
    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/pipeline`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setConnectionStatus('active');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const timestamp = new Date().toLocaleTimeString();
      
      // 1. Log Handling: Avoid duplicates and ensure category is preserved
      if (msg.type === 'log' || (msg.message && !['result', 'event'].includes(msg.type))) {
        setLogs(prev => [...prev, { ...msg, timestamp }]);
      }

      // 2. State Driving: Pipeline stage transitions
      if (msg.type === 'log' || msg.category) {
        if (msg.category === 'DETECTION') setPipelineState(p => ({ ...p, status: 'running', activeAgent: 'detection' }));
        if (msg.category === 'TRIAGE') setPipelineState(p => ({ ...p, activeAgent: 'triage', completedAgents: [...new Set([...p.completedAgents, 'detection'])] }));
        if (msg.category === 'COORDINATION') setPipelineState(p => ({ ...p, activeAgent: 'resource', completedAgents: [...new Set([...p.completedAgents, 'triage'])] }));
        if (msg.category === 'DISPATCH') setPipelineState(p => ({ ...p, activeAgent: 'allocation', completedAgents: [...new Set([...p.completedAgents, 'resource'])] }));
      }
      
      // 3. Data Integration: Flatten all relevant payloads
      if (['event', 'triage_complete', 'coordination_complete', 'result'].includes(msg.type)) {
        const payload = msg.data || msg;
        setIncidentData(prev => ({ ...prev, ...payload }));
        
        if (msg.type === 'result') {
          setPipelineState(p => ({ 
            ...p, 
            status: 'complete', 
            activeAgent: 'allocation', 
            completedAgents: ['detection', 'triage', 'resource', 'allocation'] 
          }));
          setShowSuccessModal(true);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      if (reconnectAttemptRef.current < 8) {
        setConnectionStatus('reconnecting');
        const delay = Math.min(30000, Math.pow(2, reconnectAttemptRef.current) * 1000);
        reconnectAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connectWS, delay);
      } else {
        setConnectionStatus('error');
      }
    };

    socketRef.current = ws;
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // --- MISSION CONTROL ---
  const handleSimulate = async (config = {}) => {
    // config contains: { lat, lng, label, videoFile }
    if (!config.videoFile) return;

    const lat = config.lat || 12.9716;
    const lng = config.lng || 77.5946;
    const label = config.label || 'BGLR: MISSION_SECTOR';
    const videoFile = config.videoFile;

    if (pipelineState.status === 'complete') {
        window.location.reload();
        return;
    }

    setManualActiveAgent(null); 
    setLogs([]);
    setIncidentData({});
    setShowSuccessModal(false);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('label', label);
      
      const resp = await fetch(getApiUrl('/api/upload-video'), { 
        method: 'POST', 
        body: formData 
      });

      if (!resp.ok) throw new Error("Tactical Uplink Failed");

      setPipelineState({ 
        status: 'running', 
        activeAgent: 'detection', 
        completedAgents: [], 
        missionId: Date.now() 
      });
      
      connectWS();
    } catch (e) {
      console.error("Mission execution failed:", e);
      alert("CRITICAL UPLINK ERROR: Backend nodes unreachable. Check local server status.");
    }
  };

  const handleReset = () => {
    if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
    }
    setPipelineState({ status: 'idle', activeAgent: null, completedAgents: [], missionId: null });
    setManualActiveAgent(null);
    setIncidentData({});
    setLogs([]);
    setConnectionStatus('idle');
    setShowSuccessModal(false);
    setMissionKey(prev => prev + 1);
    reconnectAttemptRef.current = 0;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col font-sans bg-slate-50 selection:bg-blue-200">
      
      {/* Clean Background */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[100px] z-0"></div>

      {/* Main Layout Grid */}
      <div className="h-full flex flex-col z-10">
        <Header 
          pipelineState={pipelineState} 
          onSimulate={handleSimulate} 
          onReset={handleReset}
          isRunning={pipelineState.status !== 'idle'} 
          missionKey={missionKey}
        />
        <PipelineNavigator 
          activeAgent={pipelineState.activeAgent} 
          completedAgents={pipelineState.completedAgents} 
          onSelectAgent={setManualActiveAgent}
        />
        
        <div className="flex-1 flex min-h-0 relative">
          <Sidebar data={incidentData} />
          
          <main className="flex-1 min-h-0 relative bg-white border-t border-zinc-100">
            {activeViewAgent === null ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-2 border-dashed border-zinc-200 rounded-full flex items-center justify-center">
                   <div className="w-10 h-10 rounded-full bg-blue-50 animate-pulse flex items-center justify-center text-blue-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
                        <path d="M12 2v20M2 12h20" />
                      </svg>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] text-zinc-400 font-black tracking-[0.4em] uppercase">Tactical Node: Standby</span>
                  <span className="text-[9px] text-zinc-300 font-bold uppercase">Awaiting Uplink Initialization</span>
                </div>
              </div>
            ) : (
              <>
                {activeViewAgent === 'detection' && <DetectionDashboard data={incidentData} logs={logs} active={true} missionId={pipelineState.missionId} />}
                {activeViewAgent === 'triage' && <TriageDashboard data={incidentData} logs={logs} active={true} />}
                {activeViewAgent === 'resource' && <ResourceDashboard data={incidentData} logs={logs} active={true} />}
                {activeViewAgent === 'allocation' && <AllocationDashboard data={incidentData} logs={logs} active={true} />}
              </>
            )}
          </main>
        </div>

        <div className="h-14">
          <StatusBar 
            connectionStatus={connectionStatus} 
            pipelineState={pipelineState} 
            incidentData={incidentData} 
          />
        </div>
      </div>

      {/* MISSION SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-[600px] shadow-[0_20px_70px_rgba(0,0,0,0.4)] p-12 text-center flex flex-col gap-6 relative overflow-hidden rounded-[32px]">
             {/* Tactical Accents */}
             <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
             <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px]"></div>
             <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px]"></div>
             
             <div className="flex flex-col gap-2 relative z-10">
                <span className="text-[10px] font-black text-emerald-400 tracking-[0.5em] uppercase">Tactical Resolution: Success</span>
                <h2 className="text-4xl font-black text-white tracking-widest uppercase">Decision Locked</h2>
             </div>
             
             <p className="text-zinc-400 text-sm leading-relaxed max-w-[85%] mx-auto relative z-10">
                All emergency units have acknowledged coordinates. Trajectories synchronized via OSRM. Trauma center pre-alert sequence confirmed.
             </p>

             <div className="w-full h-px bg-zinc-800 my-4 relative z-10"></div>

             <div className="bg-emerald-500/10 border border-emerald-500/20 self-center px-10 py-4 rounded-2xl relative z-10">
                <span className="text-[11px] font-black text-emerald-400 tracking-[0.3em] uppercase">Est. Response Interval: 4m 45s</span>
             </div>

             <button 
               onClick={() => setShowSuccessModal(false)}
               className="text-[10px] font-black text-zinc-500 hover:text-white transition-all mt-6 tracking-[0.3em] uppercase border-b border-zinc-800 pb-1 self-center"
             >
               Dismiss Mission View
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
