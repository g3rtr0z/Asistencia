import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

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
                        facingMode: "environment"
                    },
                    config,
                    (decodedText) => {
                        // Parse Chilean ID QR code
                        // Format: https://...&RUN=12345678-9&...
                        try {
                            const url = new URL(decodedText);
                            const run = url.searchParams.get('RUN');

                            if (run) {
                                // Limpiar el RUT: eliminar espacios, guiones y otros caracteres no válidos
                                const cleanRun = run.trim().replace(/[^0-9kK]/gi, '').toUpperCase();
                                onScan(cleanRun);
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

                            // Apply focus mode if supported
                            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                                await videoTrack.applyConstraints({
                                    advanced: [{ focusMode: 'continuous' }]
                                });
                            }

                            // Apply zoom if supported
                            if (capabilities.zoom) {
                                const maxZoom = capabilities.zoom.max;
                                const minZoom = capabilities.zoom.min;
                                const optimalZoom = Math.min(2.0, maxZoom);

                                await videoTrack.applyConstraints({
                                    advanced: [{ zoom: optimalZoom }]
                                });
                            }

                            // Add tap-to-focus functionality
                            const handleTapToFocus = async (e) => {
                                e.preventDefault();
                                try {
                                    const rect = videoElement.getBoundingClientRect();
                                    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
                                    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

                                    // Normalize coordinates to 0-1 range
                                    const normalizedX = x / rect.width;
                                    const normalizedY = y / rect.height;

                                    // Try to apply manual focus at the touch point
                                    if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                                        await videoTrack.applyConstraints({
                                            advanced: [{
                                                focusMode: 'manual',
                                                pointsOfInterest: [{ x: normalizedX, y: normalizedY }]
                                            }]
                                        });

                                        // Return to continuous focus after 2 seconds
                                        setTimeout(async () => {
                                            try {
                                                await videoTrack.applyConstraints({
                                                    advanced: [{ focusMode: 'continuous' }]
                                                });
                                            } catch (err) {
                                                console.log('Could not return to continuous focus');
                                            }
                                        }, 2000);
                                    } else {
                                        // Fallback: toggle between auto and continuous to trigger refocus
                                        await videoTrack.applyConstraints({
                                            advanced: [{ focusMode: 'auto' }]
                                        });
                                        setTimeout(async () => {
                                            await videoTrack.applyConstraints({
                                                advanced: [{ focusMode: 'continuous' }]
                                            });
                                        }, 100);
                                    }

                                    // Visual feedback
                                    videoElement.style.filter = 'brightness(1.2)';
                                    setTimeout(() => {
                                        videoElement.style.filter = 'brightness(1)';
                                    }, 200);
                                } catch (err) {
                                    console.log('Tap to focus error:', err);
                                }
                            };

                            // Add event listeners for both touch and click
                            videoElement.addEventListener('touchstart', handleTapToFocus);
                            videoElement.addEventListener('click', handleTapToFocus);

                            // Store cleanup function
                            videoElement._focusCleanup = () => {
                                videoElement.removeEventListener('touchstart', handleTapToFocus);
                                videoElement.removeEventListener('click', handleTapToFocus);
                            };
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
            // Clean up tap-to-focus listeners
            const videoElement = document.querySelector('#qr-reader video');
            if (videoElement && videoElement._focusCleanup) {
                videoElement._focusCleanup();
            }

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
                    </p>
                    <p className="text-xs text-slate-400 text-center mt-1">
                        💡 Toca la pantalla para enfocar manualmente
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QRScanner;
