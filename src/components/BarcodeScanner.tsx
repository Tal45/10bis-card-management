import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (errorMessage: string) => void;
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'html5qr-code-full-region';

  useEffect(() => {
    // Initialize the scanner with specific formats to reduce engine workload
    scannerRef.current = new Html5Qrcode(regionId, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.QR_CODE
      ]
    });

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: 'environment' },
          {
            fps: 30, // Higher FPS for screen scanning
            qrbox: { width: 300, height: 120 }, // Wider and shorter for Code 128
            aspectRatio: 1.777778,
            videoConstraints: {
              facingMode: 'environment',
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 },
            },
          },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage);
          }
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch((err) => {
            console.error('Failed to stop scanner:', err);
          });
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <div id={regionId} className="w-full h-full" />
      
      {/* Viewfinder Overlay */}
      <div className="absolute inset-0 border-[2px] border-carbon-blue-60 opacity-50 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[120px] border-2 border-carbon-blue-60 rounded-sm">
          <div className="absolute inset-0 bg-carbon-blue-60/10 animate-pulse" />
        </div>
      </div>
      
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-white text-xs font-medium tracking-wider uppercase bg-black/50 inline-block px-3 py-1">
          Align barcode within frame
        </p>
      </div>
    </div>
  );
}
