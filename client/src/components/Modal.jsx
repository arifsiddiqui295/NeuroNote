import React, { useState, useEffect } from 'react';

export default function Modal({ isOpen, onClose, children }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* 1. Backdrop with its own transition */}
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out backdrop-blur-sm
                    ${show ? 'bg-opacity-60' : 'bg-opacity-0'}`}
      ></div>

      {/* 2. Modal Content with responsive classes */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-gray-800 p-6 rounded-lg shadow-xl w-full mx-4 sm:max-w-lg transition-all duration-300 ease-in-out
                    ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}