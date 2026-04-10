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
      } else if (status.denied) {
        setError('Camera permission denied. Please enable it in settings.');
      }
    } catch (err) {
      console.error('Native Scan Error:', err);
      setError('Failed to start native scanner');
      document.body.classList.remove('scanner-active');
    }
  };

  const stopNativeScan = async () => {
    try {
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    } catch (err) {
      console.error('Stop Native Scan Error:', err);
    }
  };

  const handleClose = () => {
    if (isNative) {
      stopNativeScan();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Minimal Close Button */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={handleClose} 
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera View Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {isNative ? (
          // Native scanner shows camera in background, we just show a guide
          <div className="w-64 h-64 border-2 border-white/50 rounded-3xl animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
        ) : (
          // Web fallback
          <div className="w-full h-full">
            <BarcodeScannerComponent
              width="100%"
              height="100%"
              onUpdate={(err, result) => {
                if (result) {
                  onScan(result.getText());
                  handleClose();
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Status Text */}
      <div className="absolute bottom-12 left-0 right-0 text-center px-6">
        <p className="text-white/70 font-medium text-sm tracking-wide">
          {error || 'Align QR code within the frame'}
        </p>
      </div>
    </div>
  );
}
