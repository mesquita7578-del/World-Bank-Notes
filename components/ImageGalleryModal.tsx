
import React, { useState } from 'react';
import { Banknote } from '../types';

interface ImageGalleryModalProps {
  note: Banknote;
  onClose: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ note, onClose }) => {
  const imageEntries = Object.entries(note.images).filter(([_, value]) => !!value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (imageEntries.length === 0) return null;

  const currentImage = imageEntries[activeIndex][1];
  const currentLabel = {
    front: 'Frente',
    back: 'Verso',
    detail1: 'Detalhe 1',
    detail2: 'Detalhe 2'
  }[imageEntries[activeIndex][0] as keyof Banknote['images']];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % imageEntries.length);
    setZoom(1);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + imageEntries.length) % imageEntries.length);
    setZoom(1);
  };

  const toggleZoom = () => {
    setZoom(prev => prev === 1 ? 2.5 : 1);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white border-b border-white/10">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-indigo-400">{note.denomination} {note.currency}</span>
            <span className="text-slate-500 text-sm font-normal">| {note.country}</span>
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest">{currentLabel} ({activeIndex + 1} de {imageEntries.length})</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-8">
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-zoom-in transition-transform duration-300 ease-out"
          onClick={toggleZoom}
          style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
        >
          <img 
            src={currentImage} 
            alt={currentLabel}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
          />
        </div>

        {/* Navigation Arrows */}
        {imageEntries.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-indigo-600 transition-all z-10"
            >
              <i className="fa-solid fa-chevron-left text-xl"></i>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-indigo-600 transition-all z-10"
            >
              <i className="fa-solid fa-chevron-right text-xl"></i>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Footer */}
      <div className="p-4 bg-black/20 border-t border-white/10 flex justify-center gap-4 overflow-x-auto">
        {imageEntries.map(([key, src], idx) => (
          <button
            key={key}
            onClick={() => { setActiveIndex(idx); setZoom(1); }}
            className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
              activeIndex === idx ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={src} className="w-full h-full object-cover" alt={key} />
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest pointer-events-none hidden md:block">
        Clique na imagem para ampliar
      </div>
    </div>
  );
};

export default ImageGalleryModal;
