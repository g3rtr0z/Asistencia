import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alert = ({ type = 'error', message, isVisible, onClose }) => {
    const configs = {
        error: {
            bgColor: 'bg-red-50',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
        },
        warning: {
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-800',
            borderColor: 'border-amber-200',
        },
        info: {
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
        }
    };

    const config = configs[type] || configs.error;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
                >
                    <div className={`${config.bgColor} ${config.textColor} border ${config.borderColor} p-4 rounded-xl flex items-center justify-between gap-3`}>
                        <p className='text-sm font-medium flex-1'>{message}</p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="shrink-0 hover:opacity-60 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const SuccessNotification = ({ message, isVisible, onClose, autoClose = true, duration = 3000 }) => {
    React.useEffect(() => {
        if (isVisible && autoClose) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, duration, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
                >
                    <div className='bg-green-50 text-green-800 border border-green-200 p-4 rounded-xl flex items-center justify-between gap-3'>
                        <p className='text-sm font-medium flex-1'>{message}</p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="shrink-0 hover:opacity-60 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Alert;
