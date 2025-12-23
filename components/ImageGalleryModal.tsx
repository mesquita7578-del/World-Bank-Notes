
import React, { useState } from 'react';
import { Banknote } from '../types';

interface ImageGalleryModalProps {
  note: Banknote;
  onClose: () => void;
  onUpdateNote?: (note: Banknote) => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ note, onClose, onUpdateNote }) => {
  const imageEntries = Object.entries(note.images).filter(([_, value]) => !!value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isRotating, setIsRotating] = useState(false);

  if (imageEntries.length === 0) return null;

  const currentSlot = imageEntries[activeIndex][0] as keyof Banknote['images'];
  const currentImage = imageEntries[activeIndex][1] as string;
  const currentLabel = {
    front: 'Frente',
    back: 'Verso',
    detail1: 'Detalhe 1',
    detail2: 'Detalhe 2'
  }[currentSlot];

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

  const rotateImage = (degrees: number) => {
    if (isRotating || !currentImage) return;
    setIsRotating(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Swap dimensions for 90 degree rotation
      if (Math.abs(degrees) === 90) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedBase64 = canvas.toDataURL('image/png');
      
      if (onUpdateNote) {
        const updatedImages = { ...note.images, [currentSlot]: rotatedBase64 };
        onUpdateNote({ ...note, images: updatedImages });
      }
      setIsRotating(false);
    };
    img.src = currentImage;
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
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => rotateImage(-90)}
              disabled={isRotating}
              title="Girar 90° para esquerda"
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-30"
            >
              <i className={`fa-solid fa-rotate-left ${isRotating ? 'animate-spin' : ''}`}></i>
            </button>
            <button 
              onClick={() => rotateImage(90)}
              disabled={isRotating}
              title="Girar 90° para direita"
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-30"
            >
              <i className={`fa-solid fa-rotate-right ${isRotating ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-8">
        {isRotating && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <i className="fa-solid fa-spinner animate-spin text-4xl text-indigo-400"></i>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Processando Rotação...</span>
            </div>
          </div>
        )}
        
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-zoom-in transition-transform duration-300 ease-out"
          onClick={toggleZoom}
          style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
        >
          <img 
            src={currentImage} 
            alt={currentLabel}
            className="w-full h-full object-contain shadow-2xl rounded-sm max-w-full max-h-full"
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
            <img src={src as string} className="w-full h-full object-cover" alt={key} />
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-widest pointer-events-none hidden md:block">
        Clique na imagem para ampliar | Use as setas para rotacionar
      </div>
    </div>
  );
};

export default ImageGalleryModal;
