import React, { useState, useEffect } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { X, GripHorizontal } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const dragControls = useDragControls();
  const [error, setError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      startNativeScan();
    }
    return () => {
      if (isNative) {
        stopNativeScan();
      }
    };
  }, []);

  const startNativeScan = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.granted) {
        await BarcodeScanner.hideBackground();
        document.body.classList.add('scanner-active');
        const result = await BarcodeScanner.startScan();
        if (result.hasContent) {
          onScan(result.content);
          handleClose();
        }
      } else {
        setError('Camera permission denied');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const stopNativeScan = async () => {
    document.body.classList.remove('scanner-active');
    await BarcodeScanner.showBackground();
    await BarcodeScanner.stopScan();
  };

  const handleClose = () => {
    if (isNative) {
      stopNativeScan();
    }
    onClose();
  };

  if (isNative) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 pointer-events-none">
        <div className="w-full flex justify-end pointer-events-auto">
          <button 
            onClick={handleClose} 
            className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white shadow-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="w-64 h-64 border-2 border-primary rounded-3xl relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-3xl animate-pulse"></div>
        </div>

        <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl text-white text-sm font-bold pointer-events-auto">
          Scanning QR Code...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        drag
        dragMomentum={false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800"
      >
        <div 
          className="p-4 border-b dark:border-zinc-800 flex justify-between items-center cursor-move bg-zinc-50/50 dark:bg-zinc-800/50 touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal size={18} className="text-zinc-400" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Scan QR Code</h3>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
            <X size={20} />
          </button>
        </div>
        <div className="aspect-square bg-black relative flex items-center justify-center">
          {error ? (
            <div className="p-8 text-center space-y-4">
              <div className="text-red-500 font-bold">Camera Error</div>
              <p className="text-xs text-zinc-400">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div key={error ? 'retry' : 'initial'} className="w-full h-full relative">
              <BarcodeScannerComponent
                width="100%"
                height="100%"
                facingMode="environment"
                videoConstraints={{
                  facingMode: "environment"
                }}
                onUpdate={(err, result) => {
                  if (result) {
                    onScan(result.getText());
                    handleClose();
                  }
                  if (err) {
                    // Only set error if it's a real error, not just "no barcode found"
                    if (err instanceof Error) {
                      setError(err.message);
                    } else if (typeof err === 'string' && !err.includes('NotFoundException')) {
                      setError(err);
                    }
                  }
                }}
              />
              <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Position the QR code within the frame to scan automatically.
        </div>
      </motion.div>
    </div>
  );
}
