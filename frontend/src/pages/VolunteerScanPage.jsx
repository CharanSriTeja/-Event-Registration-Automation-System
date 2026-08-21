import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Camera, CameraOff, RefreshCw, LogOut, QrCode, List, Search, Calendar } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { format } from 'date-fns';

const RESULT_DISPLAY_DURATION = 3000; // ms

const VolunteerScanPage = () => {
  const scannerInstanceRef = useRef(null);
  const resetTimerRef = useRef(null);
  const isProcessingRef = useRef(false); // synchronous lock — cannot go stale like useState

  const [activeTab, setActiveTab] = useState('registrations'); // 'scanner' | 'registrations'

  // Scanner state
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [hasInitializedScanner, setHasInitializedScanner] = useState(false);

  // Registrations state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRegs, setLoadingRegs] = useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (scannerInstanceRef.current) {
      try {
        const state = scannerInstanceRef.current.getState();
        if (state === 2 || state === 3) {
          scannerInstanceRef.current.stop().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    }
    logout();
    navigate('/login');
  };

  const clearResult = useCallback(() => {
    setScanResult(null);
    isProcessingRef.current = false;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const initScanner = useCallback(async () => {
    if (scannerInstanceRef.current || cameraError) return;

    clearResult();
    const html5QrCode = new Html5Qrcode('qr-scanner-region');
    scannerInstanceRef.current = html5QrCode;

    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      let cameraConstraint = isMobile ? { facingMode: 'environment' } : undefined;
      
      if (!isMobile) {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found — please connect a webcam and refresh.');
          return;
        }
        cameraConstraint = cameras[0].id;
      }

      await html5QrCode.start(
        cameraConstraint,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // Use a ref-based lock — React state (isProcessing) is stale inside this closure
          // and would never actually block a second rapid decode.
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          try { await html5QrCode.pause(true); } catch { }

          const registrationId = decodedText.trim();

          try {
            const res = await api.post(`/scan/${registrationId}`);
            setScanResult({ success: true, message: 'Entry Granted', name: res.data.name, eventName: res.data.eventName });
          } catch (err) {
            setScanResult({ success: false, message: err.response?.data?.message || 'Scan failed.', name: null });
          }

          resetTimerRef.current = setTimeout(() => {
            clearResult();
            try { 
              if (scannerInstanceRef.current && scannerInstanceRef.current.getState() === 3) {
                scannerInstanceRef.current.resume(); 
              }
            } catch { }
            isProcessingRef.current = false;
          }, RESULT_DISPLAY_DURATION);
        },
        () => { } // ignore per-frame decode failures
      );
      setHasInitializedScanner(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Camera access is required to scan QR codes — please allow camera permission and refresh.');
      scannerInstanceRef.current = null;
    }
  }, [clearResult, cameraError]);

  useEffect(() => {
    if (activeTab === 'scanner') {
      if (!hasInitializedScanner && !scannerInstanceRef.current) {
        initScanner();
      } else if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.getState() === 3) { // PAUSED
            scannerInstanceRef.current.resume();
          }
        } catch (e) {}
      }
    } else {
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.getState() === 2) { // SCANNING
            scannerInstanceRef.current.pause(true);
          }
        } catch (e) {}
      }
    }
  }, [activeTab, hasInitializedScanner, initScanner]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (scannerInstanceRef.current) {
        try {
          const state = scannerInstanceRef.current.getState();
          if (state === 2 || state === 3) {
            scannerInstanceRef.current.stop().catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, []);

  const handleScanNext = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    clearResult();
    isProcessingRef.current = false;
    if (scannerInstanceRef.current) {
      try { 
        if (scannerInstanceRef.current.getState() === 3) {
          scannerInstanceRef.current.resume(); 
        }
      } catch { }
    }
  };

  // Fetch events for dropdown
  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data)).catch(console.error);
  }, []);

  // Fetch registrations when selected event or search changes
  useEffect(() => {
    if (activeTab === 'registrations' && selectedEventId) {
      setLoadingRegs(true);
      const timeoutId = setTimeout(() => {
        api.get(`/scan/events/${selectedEventId}/registrations?search=${searchQuery}`)
          .then(res => setRegistrations(res.data))
          .catch(console.error)
          .finally(() => setLoadingRegs(false));
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setRegistrations([]);
    }
  }, [activeTab, selectedEventId, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">EventHub Scanner</p>
            <p className="text-slate-400 text-xs">Volunteer Portal</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm py-1.5 px-3 rounded-lg hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 border-b border-white/10">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'scanner' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <Camera className="w-4 h-4" /> Scanner
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'registrations' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <List className="w-4 h-4" /> Registrations
        </button>
      </div>

      {/* Scanner view */}
      <div className={`flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-8 max-w-lg mx-auto w-full ${activeTab === 'scanner' ? 'flex' : 'hidden'}`}>
        <h1 className="text-white font-extrabold text-2xl mb-1 text-center">Scan QR Code</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Point camera at participant's QR code to grant entry</p>

        {cameraError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-900/40 border border-red-500/50 rounded-2xl p-5 flex flex-col items-center text-center mb-6"
          >
            <CameraOff className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-200 font-semibold text-sm mb-1">Camera Access Denied</p>
            <p className="text-red-300/80 text-xs">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors"
            >
              Refresh Page
            </button>
          </motion.div>
        )}

        <div className={`w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6 bg-black ${cameraError ? 'hidden' : 'block'}`}>
          <div id="qr-scanner-region" className="w-full min-h-[250px]" />
        </div>

        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`w-full rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl border ${scanResult.success
                ? 'bg-emerald-900/60 border-emerald-500/50'
                : 'bg-red-900/60 border-red-500/50'
                }`}
            >
              {scanResult.success ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3" />
                  </motion.div>
                  <p className="text-2xl font-extrabold text-emerald-200 mb-1">{scanResult.message}</p>
                  <p className="text-emerald-100 font-bold text-lg">{scanResult.name}</p>
                  {scanResult.eventName && (
                    <p className="text-emerald-400 text-sm mt-1">{scanResult.eventName}</p>
                  )}
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.1 }}
                  >
                    <XCircle className="w-16 h-16 text-red-400 mb-3" />
                  </motion.div>
                  <p className="text-xl font-extrabold text-red-200 mb-2">Entry Denied</p>
                  <p className="text-red-300 text-sm max-w-xs">{scanResult.message}</p>
                </>
              )}

              <button
                onClick={handleScanNext}
                className="mt-5 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-white/20 hover:bg-white/30 transition-colors border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Next
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!scanResult && !cameraError && (
          <div className="flex flex-col items-center text-slate-500 text-sm gap-2">
            <Camera className="w-5 h-5" />
            <p>Waiting for QR code…</p>
          </div>
        )}
      </div>

      {/* Registrations view */}
      <div className={`flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full ${activeTab === 'registrations' ? 'flex' : 'hidden'}`}>
        <h2 className="text-white text-xl font-bold mb-4">Event Registrations</h2>
        
        <select 
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Select an Event...</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        
        {selectedEventId && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name, ID or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
              />
            </div>

            {loadingRegs ? (
              <div className="text-slate-400 text-center py-10 flex flex-col items-center">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                <p>Loading registrations...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pb-20">
                {registrations.length > 0 ? registrations.map(reg => (
                  <div key={reg.id} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 shadow-sm hover:border-slate-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-white font-bold">{reg.name}</p>
                        <p className="text-slate-400 text-xs font-mono mt-0.5">{reg.registrationId}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${reg.entered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-300'}`}>
                        {reg.entered ? 'Scanned' : 'Pending'}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-700/50 text-xs">
                      <div className="flex items-center text-slate-400">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        Registered: <span className="text-slate-300 ml-1 font-medium">{format(new Date(reg.registeredAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      {reg.entered && (
                        <div className="flex items-center text-emerald-400/80">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                          Scanned At: <span className="text-emerald-300 ml-1 font-medium">{reg.entryTimestamp ? format(new Date(reg.entryTimestamp), 'MMM d, yyyy h:mm a') : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-500 text-center py-12 flex flex-col items-center bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <Search className="w-8 h-8 mb-3 opacity-50" />
                    <p>No registrations found.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VolunteerScanPage;