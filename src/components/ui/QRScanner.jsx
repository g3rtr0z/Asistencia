import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

// Add focus ring animation
const focusRingStyle = document.createElement('style');
focusRingStyle.textContent = `
  @keyframes focusPulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#focus-ring-style')) {
    focusRingStyle.id = 'focus-ring-style';
    document.head.appendChild(focusRingStyle);
}


const QRScanner = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const videoTrackRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                };

                await html5QrCode.start(
                    {
                        facingMode: "environment",
                        // Force main camera lens on iPhone (not ultra-wide)
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    config,
                    (decodedText) => {
                        // Parse Chilean ID QR code
                        // Format: https://...&RUN=12345678-9&...
                        try {
                            const url = new URL(decodedText);
                            const run = url.searchParams.get('RUN');

                            if (run) {
                                onScan(run);
                                stopScanner();
                            } else {
                                setError('No se encontró RUT en el código QR');
                            }
                        } catch (e) {
                            setError('Código QR no válido');
                        }
                    },
                    (errorMessage) => {
                        // Scanning errors are normal, ignore them
                    }
                );

                // Apply continuous autofocus after scanner starts
                setTimeout(async () => {
                    try {
                        const videoElement = document.querySelector('#qr-reader video');
                        if (videoElement && videoElement.srcObject) {
                            const stream = videoElement.srcObject;
                            const videoTrack = stream.getVideoTracks()[0];
                            videoTrackRef.current = videoTrack;

                            const capabilities = videoTrack.getCapabilities();
                            const constraints = { advanced: [] };

                            // Apply focus mode if supported
                            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                                constraints.advanced.push({ focusMode: 'continuous' });
                            }

                            // Apply zoom if supported (helps with small QR codes)
                            if (capabilities.zoom) {
                                const maxZoom = capabilities.zoom.max;
                                const optimalZoom = Math.min(1.5, maxZoom);
                                constraints.advanced.push({ zoom: optimalZoom });
                            }

                            // Enable torch/flash if available (helps in low light)
                            if (capabilities.torch) {
                                constraints.advanced.push({ torch: true });
                            }

                            // Apply all constraints at once
                            if (constraints.advanced.length > 0) {
                                await videoTrack.applyConstraints(constraints);
                            }

                            // Add tap-to-focus functionality
                            const handleTapToFocus = async (e) => {
                                e.preventDefault();
                                try {
                                    const track = videoTrackRef.current;
                                    if (!track) return;

                                    const caps = track.getCapabilities();

                                    // Try to trigger manual focus
                                    if (caps.focusMode) {
                                        // First switch to manual/single-shot mode
                                        if (caps.focusMode.includes('single-shot')) {
                                            await track.applyConstraints({
                                                advanced: [{ focusMode: 'single-shot' }]
                                            });

                                            // Wait a bit then switch back to continuous
                                            setTimeout(async () => {
                                                try {
                                                    if (caps.focusMode.includes('continuous')) {
                                                        await track.applyConstraints({
                                                            advanced: [{ focusMode: 'continuous' }]
                                                        });
                                                    }
                                                } catch (err) {
                                                    console.log('Could not switch back to continuous focus:', err);
                                                }
                                            }, 1000);
                                        } else if (caps.focusMode.includes('manual')) {
                                            // Toggle manual focus to trigger refocus
                                            await track.applyConstraints({
                                                advanced: [{ focusMode: 'manual' }]
                                            });
                                            setTimeout(async () => {
                                                try {
                                                    if (caps.focusMode.includes('continuous')) {
                                                        await track.applyConstraints({
                                                            advanced: [{ focusMode: 'continuous' }]
                                                        });
                                                    }
                                                } catch (err) {
                                                    console.log('Could not switch back to continuous focus:', err);
                                                }
                                            }, 1000);
                                        }
                                    }

                                    // Visual feedback
                                    const rect = videoElement.getBoundingClientRect();
                                    const x = e.clientX || (e.touches && e.touches[0].clientX);
                                    const y = e.clientY || (e.touches && e.touches[0].clientY);

                                    if (x && y) {
                                        const focusRing = document.createElement('div');
                                        focusRing.style.cssText = `
                                            position: fixed;
                                            left: ${x - 40}px;
                                            top: ${y - 40}px;
                                            width: 80px;
                                            height: 80px;
                                            border: 2px solid #10b981;
                                            border-radius: 50%;
                                            pointer-events: none;
                                            z-index: 9999;
                                            animation: focusPulse 0.6s ease-out;
                                        `;
                                        document.body.appendChild(focusRing);
                                        setTimeout(() => focusRing.remove(), 600);
                                    }
                                } catch (err) {
                                    console.log('Tap to focus error:', err);
                                }
                            };

                            // Add event listeners for tap-to-focus
                            videoElement.addEventListener('touchstart', handleTapToFocus);
                            videoElement.addEventListener('click', handleTapToFocus);
                            videoElement.style.cursor = 'pointer';
                        }
                    } catch (err) {
                        console.log('Could not apply advanced camera settings:', err);
                    }
                }, 500);

            } catch (err) {
                setError('No se pudo acceder a la cámara');
                console.error('Scanner error:', err);
            }
        };

        const stopScanner = async () => {
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                    html5QrCodeRef.current.clear();
                } catch (err) {
                    console.error('Error stopping scanner:', err);
                }
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, [isOpen, onScan]);

    const handleClose = () => {
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Escanear Carnet</h3>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden"></div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    <p className="text-xs text-slate-500 text-center">
                        Apunta la cámara al código QR de tu carnet
                        <br />
                        <span className="text-st-verde font-medium">Toca la pantalla para enfocar</span>
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QRScanner;
