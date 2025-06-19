'use client';
// import { XMarkIcon } from '@heroicons/react/24/outline'; // Icon omitted due to installation issues

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          {/* Placeholder for XMarkIcon, consider adding a simple "X" text or SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && <h2 className="text-xl font-semibold text-gray-900 mb-5 border-b pb-3">{title}</h2>}
        {children}
      </div>
      {/* Simple animation using keyframes (add to globals.css or a style tag if not already present) */}
      <style jsx global>{`
        @keyframes modalShow {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
