import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { X, GripHorizontal, Zap } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  
  // Scan control refs
  const lastScanTime = React.useRef<number>(0);
  const lastCode = React.useRef<string>("");
  const scanActive = React.useRef<boolean>(true);

  useEffect(() => {
    // Expose scan result handler to window for native bridge
    (window as any).onScanResult = (code: string) => {
      onScan(code);
    };

    if (isNative) {
      prepareScanner();
    }
    return () => {
      delete (window as any).onScanResult;
      scanActive.current = false;
      if (isNative) {
        stopNativeScan();
      }
    };
  }, []);

  const prepareScanner = async () => {
    try {
      // If our custom native scanner is available, use it
      if ((window as any).AndroidScanner) {
        (window as any).AndroidScanner.openNativeScanner();
        setIsScanning(true);
      } else {
        await BarcodeScanner.prepare();
        startContinuousScan();
      }
    } catch (err) {
      console.error('Prepare Scanner Error:', err);
      startContinuousScan();
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Beep failed:', e);
    }
  };

  const startContinuousScan = async () => {
    if (!scanActive.current) return;
    
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        await BarcodeScanner.hideBackground();
        document.body.classList.add('scanner-active');
        document.documentElement.classList.add('scanner-active');
        setIsScanning(true);
        
        // Loop for continuous scanning
        while (scanActive.current) {
          const result = await BarcodeScanner.startScan({
            targetedFormats: [SupportedFormat.QR_CODE, SupportedFormat.EAN_13, SupportedFormat.EAN_8, SupportedFormat.CODE_128]
          });
          
          if (result.hasContent && scanActive.current) {
            const code = result.content;
            const currentTime = Date.now();

            // Prevent duplicate scans (1.5s delay for same code)
            if (code === lastCode.current && (currentTime - lastScanTime.current) < 1500) {
              continue;
            }

            lastCode.current = code;
            lastScanTime.current = currentTime;

            // Feedback
            playBeep();
            Haptics.impact({ style: ImpactStyle.Heavy });
            
            // Send to POS
            onScan(code);
            
            // Small delay before next scan to prevent CPU hogging
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        setError('Camera permission denied');
      }
    } catch (err) {
      console.error('Native Scan Error:', err);
      setIsScanning(false);
      document.body.classList.remove('scanner-active');
      document.documentElement.classList.remove('scanner-active');
    }
  };

  const toggleTorch = async () => {
    try {
      if (isTorchOn) {
        await BarcodeScanner.disableTorch();
      } else {
        await BarcodeScanner.enableTorch();
      }
      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.error('Torch Error:', err);
    }
  };

  const stopNativeScan = async () => {
    scanActive.current = false;
    try {
      document.body.classList.remove('scanner-active');
      document.documentElement.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      await BarcodeScanner.disableTorch();
    } catch (err) {
      console.error('Stop Native Scan Error:', err);
    }
  };

  const handleClose = () => {
    stopNativeScan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-20 flex items-center justify-between px-6">
        <button 
          onClick={handleClose} 
          className="p-2 text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={28} />
        </button>
        
        {isNative && (
          <button 
            onClick={toggleTorch}
            className={`p-3 rounded-full transition-all ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
          >
            <Zap size={24} fill={isTorchOn ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Camera View Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {isNative && !error ? (
          <div className="relative w-72 h-72">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
            
            {/* Scanning Animation Line */}
            <div className="absolute left-4 right-4 h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] animate-scan-line"></div>
            
            {/* Darkened Overlay around the frame */}
            <div className="absolute -inset-[2000px] border-[2000px] border-black/40 pointer-events-none"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {error ? (
              <div className="text-white text-center p-6">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={handleClose} className="px-6 py-2 bg-white/10 rounded-xl">Close</button>
              </div>
            ) : (
              <div className="text-white text-center">
                <p className="animate-pulse">Initializing native scanner...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-20 flex flex-col items-center justify-center px-6 gap-2">
        <p className="text-white font-bold text-sm tracking-widest uppercase">
          {isNative ? 'Continuous Hardware Scan' : 'Web Scanner Active'}
        </p>
        <p className="text-white/60 text-xs">
          {isScanning ? 'Scanner is active. Align barcode within the frame.' : 'Preparing camera...'}
        </p>
      </div>
    </div>
  );
}

