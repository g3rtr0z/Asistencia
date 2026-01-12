import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const QRScanner = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
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
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
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
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QRScanner;
