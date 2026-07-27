import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

// Helper para extraer el RUT de cualquier código QR de Carnet de Identidad Chileno
const extraerRutDeQR = (text) => {
    if (!text) return null;

    try {
        const urlString = text.startsWith('http') ? text : `https://${text.startsWith('/') ? 'local' + text : text}`;
        const url = new URL(urlString);
        const run = url.searchParams.get('RUN') || 
                    url.searchParams.get('run') || 
                    url.searchParams.get('RUT') || 
                    url.searchParams.get('rut') ||
                    url.searchParams.get('id');
        if (run) {
            const clean = run.trim().replace(/[^0-9kK]/gi, '').toUpperCase();
            if (clean.length >= 7 && clean.length <= 9) return clean;
        }
    } catch (e) {
        // Ignorar error de URL
    }

    const matchParam = text.match(/(?:RUN|run|RUT|rut)=([0-9]{7,8}-?[0-9kK])/i);
    if (matchParam && matchParam[1]) {
        const clean = matchParam[1].replace(/[^0-9kK]/gi, '').toUpperCase();
        if (clean.length >= 7 && clean.length <= 9) return clean;
    }

    const matchRut = text.match(/([0-9]{7,8}-?[0-9kK])/i);
    if (matchRut && matchRut[1]) {
        const clean = matchRut[1].replace(/[^0-9kK]/gi, '').toUpperCase();
        if (clean.length >= 7 && clean.length <= 9) return clean;
    }

    return null;
};

const QRScanner = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const videoTrackRef = useRef(null);
    const [error, setError] = useState('');
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!isOpen) return;

        let isSubscribed = true;

        const stopScanner = async () => {
            const videoElement = document.querySelector('#qr-reader video');
            if (videoElement && videoElement._focusCleanup) {
                videoElement._focusCleanup();
            }

            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        await html5QrCodeRef.current.stop();
                    }
                    html5QrCodeRef.current.clear();
                } catch (err) {
                    console.error('Error stopping scanner:', err);
                } finally {
                    html5QrCodeRef.current = null;
                }
            }
        };

        const startScanner = async () => {
            try {
                // Limpiar el contenedor antes de iniciar para evitar cámaras duplicadas
                const container = document.getElementById("qr-reader");
                if (container) {
                    container.innerHTML = '';
                }

                if (html5QrCodeRef.current) {
                    await stopScanner();
                }

                if (!isSubscribed) return;

                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        const cleanRun = extraerRutDeQR(decodedText);
                        if (cleanRun) {
                            setError('');
                            if (onScanRef.current) {
                                onScanRef.current(cleanRun);
                            }
                            stopScanner();
                        } else {
                            setError('No se pudo extraer el RUT del código QR');
                        }
                    },
                    (errorMessage) => {
                        // Scanning errors are normal, ignore them
                    }
                );

                if (!isSubscribed) return;

                // Invertir horizontalmente la cámara en computadoras de escritorio
                const isDesktop = window.innerWidth >= 768;
                const videoElement = document.querySelector('#qr-reader video');
                if (videoElement && isDesktop) {
                    videoElement.style.transform = 'scaleX(-1)';
                }

                // Autocoenfoque y soporte táctil
                setTimeout(async () => {
                    if (!isSubscribed) return;
                    try {
                        const vidEl = document.querySelector('#qr-reader video');
                        if (vidEl && vidEl.srcObject) {
                            const stream = vidEl.srcObject;
                            const videoTrack = stream.getVideoTracks()[0];
                            videoTrackRef.current = videoTrack;

                            const capabilities = videoTrack.getCapabilities();

                            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                                await videoTrack.applyConstraints({
                                    advanced: [{ focusMode: 'continuous' }]
                                });
                            }

                            if (capabilities.zoom) {
                                const maxZoom = capabilities.zoom.max;
                                const optimalZoom = Math.min(2.0, maxZoom);
                                await videoTrack.applyConstraints({
                                    advanced: [{ zoom: optimalZoom }]
                                });
                            }

                            const handleTapToFocus = async (e) => {
                                e.preventDefault();
                                try {
                                    const rect = vidEl.getBoundingClientRect();
                                    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
                                    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

                                    const normalizedX = x / rect.width;
                                    const normalizedY = y / rect.height;

                                    if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                                        await videoTrack.applyConstraints({
                                            advanced: [{
                                                focusMode: 'manual',
                                                pointsOfInterest: [{ x: normalizedX, y: normalizedY }]
                                            }]
                                        });

                                        setTimeout(async () => {
                                            try {
                                                await videoTrack.applyConstraints({
                                                    advanced: [{ focusMode: 'continuous' }]
                                                });
                                            } catch (err) {
                                                console.log('Could not return to continuous focus');
                                            }
                                        }, 2000);
                                    }
                                } catch (err) {
                                    console.log('Tap to focus error:', err);
                                }
                            };

                            vidEl.addEventListener('touchstart', handleTapToFocus);
                            vidEl.addEventListener('click', handleTapToFocus);

                            vidEl._focusCleanup = () => {
                                vidEl.removeEventListener('touchstart', handleTapToFocus);
                                vidEl.removeEventListener('click', handleTapToFocus);
                            };
                        }
                    } catch (err) {
                        console.log('Advanced camera settings note:', err);
                    }
                }, 500);

            } catch (err) {
                if (isSubscribed) {
                    setError('No se pudo acceder a la cámara');
                    console.error('Scanner error:', err);
                }
            }
        };

        startScanner();

        return () => {
            isSubscribed = false;
            stopScanner();
        };
    }, [isOpen]);

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
