import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Camera, CameraOff, RefreshCw, LogOut, QrCode } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const RESULT_DISPLAY_DURATION = 3000; // ms

const VolunteerScanPage = () => {
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const resetTimerRef = useRef(null);

  const [scanResult, setScanResult] = useState(null); // { success, message, name }
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearResult = useCallback(() => {
    setScanResult(null);
    setIsProcessing(false);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  // const startScanner = useCallback(() => {
  //   if (scannerInstanceRef.current) {
  //     try { scannerInstanceRef.current.clear(); } catch { }
  //     scannerInstanceRef.current = null;
  //   }
  //   setScanning(false);
  //   clearResult();
  //   setCameraError('');

  //   if (!scannerRef.current) return;

  //   const scanner = new Html5QrcodeScanner(
  //     'qr-scanner-region',
  //     {
  //       fps: 10,
  //       qrbox: { width: 250, height: 250 },
  //       supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
  //       rememberLastUsedCamera: true,
  //       showTorchButtonIfSupported: true,
  //     },
  //     /* verbose= */ false
  //   );

  //   scanner.render(
  //     async (decodedText) => {
  //       // Prevent double-processing
  //       if (isProcessing) return;
  //       setIsProcessing(true);

  //       // Pause scanner visually while processing
  //       try { scanner.pause(true); } catch { }

  //       // Extract registrationId — handle full URLs or plain IDs
  //       let registrationId = decodedText.trim();
  //       try {
  //         const url = new URL(decodedText);
  //         const parts = url.pathname.split('/');
  //         registrationId = parts[parts.length - 1] || registrationId;
  //       } catch {
  //         // not a URL, use as-is
  //       }

  //       try {
  //         const res = await api.post(`/scan/${registrationId}`);
  //         setScanResult({ success: true, message: `Entry Granted`, name: res.data.name, eventName: res.data.eventName });
  //       } catch (err) {
  //         const msg = err.response?.data?.message || 'Scan failed. Please try again.';
  //         setScanResult({ success: false, message: msg, name: null });
  //       }

  //       // Auto-reset after display duration
  //       resetTimerRef.current = setTimeout(() => {
  //         clearResult();
  //         try { scanner.resume(); } catch { }
  //         setIsProcessing(false);
  //       }, RESULT_DISPLAY_DURATION);
  //     },
  //     (errorMessage) => {
  //       // QR decode errors are frequent/normal — only handle camera access errors
  //       if (
  //         errorMessage.includes('NotAllowedError') ||
  //         errorMessage.includes('Permission') ||
  //         errorMessage.includes('getUserMedia')
  //       ) {
  //         setCameraError('Camera access is required to scan QR codes — please allow camera permission and refresh.');
  //       }
  //     }
  //   );

  //   scannerInstanceRef.current = scanner;
  //   setScanning(true);
  // }, [clearResult, isProcessing]);

// inside your component, replace startScanner with:


const startScanner = useCallback(async () => {
  clearResult();
  setCameraError('');

  const html5QrCode = new Html5Qrcode('qr-scanner-region');
  scannerInstanceRef.current = html5QrCode;

  try {
    await html5QrCode.start(
      { facingMode: 'environment' }, // or just remove this line for laptop default cam
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try { await html5QrCode.pause(true); } catch {}

        let registrationId = decodedText.trim();
        try {
          const url = new URL(decodedText);
          const parts = url.pathname.split('/');
          registrationId = parts[parts.length - 1] || registrationId;
        } catch {}

        try {
          const res = await api.post(`/scan/${registrationId}`);
          setScanResult({ success: true, message: 'Entry Granted', name: res.data.name, eventName: res.data.eventName });
        } catch (err) {
          setScanResult({ success: false, message: err.response?.data?.message || 'Scan failed.', name: null });
        }

        resetTimerRef.current = setTimeout(() => {
          clearResult();
          try { html5QrCode.resume(); } catch {}
          setIsProcessing(false);
        }, RESULT_DISPLAY_DURATION);
      },
      () => {} // ignore per-frame decode failures
    );
    setScanning(true);
  } catch (err) {
    console.error('Camera start error:', err);
    setCameraError('Camera access is required to scan QR codes — please allow camera permission and refresh.');
  }
}, [clearResult, isProcessing]);

  
  useEffect(() => {
  const t = setTimeout(startScanner, 200);

  return () => {
    clearTimeout(t);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.stop().catch(() => {});
    }
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const handleScanNext = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    clearResult();
    if (scannerInstanceRef.current) {
      try { scannerInstanceRef.current.resume(); } catch { }
    }
  };

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
          id="volunteer-logout"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm py-1.5 px-3 rounded-lg hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-8 max-w-lg mx-auto w-full">
        <h1 className="text-white font-extrabold text-2xl mb-1 text-center">Scan QR Code</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Point camera at participant's QR code to grant entry</p>

        {/* Camera error */}
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

        {/* Scanner region */}
        {!cameraError && (
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6 bg-black">
            <div id="qr-scanner-region" className="w-full" />
          </div>
        )}

        {/* Result overlay banner */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              key="result"
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
                id="scan-next-btn"
                onClick={handleScanNext}
                className="mt-5 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-white/20 hover:bg-white/30 transition-colors border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Next
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle prompt */}
        {!scanResult && !cameraError && (
          <div className="flex flex-col items-center text-slate-500 text-sm gap-2">
            <Camera className="w-5 h-5" />
            <p>Waiting for QR code…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerScanPage;