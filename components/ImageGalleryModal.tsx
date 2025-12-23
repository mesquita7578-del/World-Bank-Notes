
import React, { useState } from 'react';
import { Banknote } from '../types';
import { geminiService } from '../services/geminiService';

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
  const [isSearching, setIsSearching] = useState(false);
  const [historyInfo, setHistoryInfo] = useState<{ text: string, sources: any[] } | null>(null);

  if (imageEntries.length === 0) return null;

  const currentSlot = imageEntries[activeIndex][0] as keyof Banknote['images'];
  const currentImage = imageEntries[activeIndex][1] as string;

  const handleResearch = async () => {
    setIsSearching(true);
    try {
      const result = await geminiService.getHistoricalContext(note);
      setHistoryInfo(result);
    } catch (e) {
      alert("Erro na pesquisa.");
    } finally {
      setIsSearching(false);
    }
  };

  const rotateImage = (degrees: number) => {
    if (isRotating || !currentImage) return;
    setIsRotating(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      if (Math.abs(degrees) === 90) { canvas.width = img.height; canvas.height = img.width; }
      else { canvas.width = img.width; canvas.height = img.height; }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotated = canvas.toDataURL('image/png');
      if (onUpdateNote) onUpdateNote({ ...note, images: { ...note.images, [currentSlot]: rotated } });
      setIsRotating(false);
    };
    img.src = currentImage;
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/98 backdrop-blur-3xl print:bg-white print:relative print:z-0 print:h-auto print:inset-auto">
      {/* Header Modal */}
      <div className="flex items-center justify-between p-4 text-white border-b border-white/10 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-indigo-400">{note.denomination} {note.currency} <span className="text-slate-500 font-normal">| {note.country}</span></h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Pick: {note.pickId || 'Não inf.'} • Estado: {note.grade || 'Não inf.'}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleResearch} disabled={isSearching} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center gap-2">
            {isSearching ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-magnifying-glass-location"></i>}
            Pesquisa Histórica (IA)
          </button>
          <button onClick={() => window.print()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"><i className="fa-solid fa-print"></i></button>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <button onClick={() => rotateImage(-90)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10"><i className="fa-solid fa-rotate-left"></i></button>
          <button onClick={() => rotateImage(90)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10"><i className="fa-solid fa-rotate-right"></i></button>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-rose-500/20 text-rose-400 transition-colors"><i className="fa-solid fa-xmark text-2xl"></i></button>
        </div>
      </div>

      {/* Viewport Principal / Print Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 overflow-y-auto print:block print:p-0">
        <div className="flex-1 flex flex-col items-center justify-center print:block">
           <div className="relative w-full h-[60vh] flex items-center justify-center print:h-auto print:mb-8">
              <img src={currentImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm print:shadow-none print:w-full" alt="banknote" />
           </div>
           
           <div className="hidden print:grid grid-cols-2 gap-8 border-t-2 border-slate-900 pt-8 mt-8">
              <div>
                <h1 className="text-4xl font-black mb-2 uppercase">{note.country}</h1>
                <p className="text-2xl font-bold text-slate-600 mb-6">{note.denomination} {note.currency}</p>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div><p className="font-bold uppercase text-[10px] text-slate-400">Pick ID</p><p className="text-lg font-bold">{note.pickId || '---'}</p></div>
                  <div><p className="font-bold uppercase text-[10px] text-slate-400">Emissão</p><p className="text-lg font-bold">{note.issueDate || '---'}</p></div>
                  <div><p className="font-bold uppercase text-[10px] text-slate-400">Material</p><p className="text-lg font-bold">{note.material}</p></div>
                  <div><p className="font-bold uppercase text-[10px] text-slate-400">Conservação</p><p className="text-lg font-bold">{note.grade}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h3 className="text-xs font-black uppercase mb-4 tracking-widest text-indigo-500">Observações</h3>
                <p className="text-sm italic leading-relaxed text-slate-700">{note.comments || 'Nenhuma observação técnica adicional registrada.'}</p>
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-300 uppercase">Arquivo Numismático Global • Certificado Digital</p>
                </div>
              </div>
           </div>
        </div>

        {/* Painel IA Lateral */}
        {historyInfo && (
          <div className="w-full md:w-[400px] bg-white/5 border border-white/10 rounded-3xl p-6 overflow-y-auto animate-in slide-in-from-right duration-500 print:hidden">
            <h3 className="text-indigo-400 font-black mb-4 flex items-center gap-2">
              <i className="fa-solid fa-book-open"></i> Contexto Histórico
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-6">
              {historyInfo.text}
            </div>
            {historyInfo.sources.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Fontes da Web</h4>
                <div className="flex flex-col gap-2">
                  {historyInfo.sources.map((chunk: any, i: number) => (
                    <a key={i} href={chunk.web?.uri} target="_blank" className="text-[10px] text-indigo-400 hover:underline truncate">
                      {chunk.web?.title || chunk.web?.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails Modal */}
      <div className="p-4 bg-black/20 border-t border-white/10 flex justify-center gap-4 print:hidden">
        {imageEntries.map(([key, src], idx) => (
          <button key={key} onClick={() => setActiveIndex(idx)} className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-indigo-500 scale-110' : 'border-transparent opacity-50'}`}>
            <img src={src as string} className="w-full h-full object-cover" alt="thumb" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGalleryModal;
