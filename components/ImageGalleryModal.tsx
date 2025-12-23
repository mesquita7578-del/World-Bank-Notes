
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

  const InfoItem = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-200">{value || '---'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/98 backdrop-blur-3xl print:bg-white print:relative print:z-0 print:h-auto print:inset-auto">
      {/* Header Modal */}
      <div className="flex items-center justify-between p-4 text-white border-b border-white/10 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-indigo-400">
            {note.denomination} {note.currency} 
            <span className="text-slate-500 font-normal ml-2">| {note.country}</span>
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Visualizando {activeIndex + 1} de {imageEntries.length} imagens
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResearch} 
            disabled={isSearching} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSearching ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
            Análise Histórica (IA)
          </button>
          <button onClick={() => window.print()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors" title="Imprimir Ficha">
            <i className="fa-solid fa-print"></i>
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <button onClick={() => rotateImage(-90)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" title="Girar Esquerda">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
          <button onClick={() => rotateImage(90)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" title="Girar Direita">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-rose-500/20 text-rose-400 transition-colors">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden print:block print:p-0">
        
        {/* Viewport da Imagem */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden print:block print:p-0 print:mb-8">
           <div className="relative w-full h-full flex items-center justify-center cursor-zoom-in group print:h-auto">
              <img 
                src={currentImage} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300 print:shadow-none print:w-full" 
                style={{ transform: `scale(${zoom})` }}
                onClick={() => setZoom(zoom === 1 ? 2 : 1)}
                alt="banknote" 
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-white/60 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Clique para ampliar
              </div>
           </div>
        </div>

        {/* Painel Lateral de Informações (On Screen) */}
        <div className="w-full md:w-[450px] bg-slate-900/50 border-l border-white/10 flex flex-col overflow-y-auto print:hidden">
          
          {/* Ficha Técnica Estruturada */}
          <div className="p-8 border-b border-white/10">
            <h3 className="text-white font-black mb-6 flex items-center gap-3">
              <i className="fa-solid fa-list-ul text-indigo-400"></i>
              Ficha Técnica
            </h3>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <InfoItem label="País" value={note.country} />
              <InfoItem label="Denominação" value={note.denomination} />
              <InfoItem label="Moeda" value={note.currency} />
              <InfoItem label="Data/Ano" value={note.issueDate} />
              <InfoItem label="Pick ID" value={note.pickId} />
              <InfoItem label="Estado (Grade)" value={note.grade} />
              <InfoItem label="Material" value={note.material} />
              <InfoItem label="Tamanho" value={note.size} />
              <div className="col-span-2">
                <InfoItem label="Autoridade Emissora" value={note.authority} />
              </div>
              <div className="col-span-2">
                <InfoItem 
                  label="Valor Estimado" 
                  value={note.estimatedValue ? Number(note.estimatedValue).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : '---'} 
                />
              </div>
            </div>

            {note.comments && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <InfoItem label="Observações do Colecionador" value={note.comments} />
              </div>
            )}
          </div>

          {/* Contexto Histórico (IA) */}
          <div className={`p-8 transition-all duration-500 ${historyInfo ? 'opacity-100' : 'opacity-40'}`}>
            <h3 className="text-indigo-400 font-black mb-6 flex items-center gap-3">
              <i className="fa-solid fa-scroll"></i>
              Contexto Histórico
            </h3>
            
            {!historyInfo ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Utilize o botão "Análise Histórica" no topo para pesquisar curiosidades e fatos sobre esta cédula via IA.
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                  {historyInfo.text}
                </div>
                
                {historyInfo.sources.length > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Fontes Verificadas</h4>
                    <div className="flex flex-col gap-3">
                      {historyInfo.sources.map((chunk: any, i: number) => (
                        <a 
                          key={i} 
                          href={chunk.web?.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <i className="fa-solid fa-link text-[10px] opacity-40 group-hover:opacity-100"></i>
                          <span className="truncate">{chunk.web?.title || chunk.web?.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Print Layout (Only visible when printing) */}
        <div className="hidden print:block w-full p-0">
           <div className="grid grid-cols-2 gap-12 border-t-4 border-slate-900 pt-12">
              <div>
                <h1 className="text-5xl font-black mb-2 uppercase tracking-tight text-slate-900">{note.country}</h1>
                <p className="text-3xl font-bold text-slate-600 mb-8">{note.denomination} {note.currency}</p>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                  <div><p className="font-black uppercase text-[10px] text-slate-400 mb-1">Pick ID</p><p className="text-xl font-bold">{note.pickId || '---'}</p></div>
                  <div><p className="font-black uppercase text-[10px] text-slate-400 mb-1">Emissão</p><p className="text-xl font-bold">{note.issueDate || '---'}</p></div>
                  <div><p className="font-black uppercase text-[10px] text-slate-400 mb-1">Material</p><p className="text-xl font-bold">{note.material}</p></div>
                  <div><p className="font-black uppercase text-[10px] text-slate-400 mb-1">Conservação</p><p className="text-xl font-bold">{note.grade}</p></div>
                  <div className="col-span-2"><p className="font-black uppercase text-[10px] text-slate-400 mb-1">Autoridade</p><p className="text-lg font-bold">{note.authority || '---'}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase mb-4 tracking-widest text-indigo-600">Descrição e Observações</h3>
                  <p className="text-sm italic leading-relaxed text-slate-700">{note.comments || 'Nenhuma observação técnica adicional registrada para este item no acervo.'}</p>
                </div>
                <div className="pt-8 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Numis-Archive Global • Certificado de Catalogação</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Thumbnails Modal (Footer) */}
      <div className="p-4 bg-black/40 border-t border-white/10 flex justify-center gap-4 print:hidden overflow-x-auto">
        {imageEntries.map(([key, src], idx) => (
          <button 
            key={key} 
            onClick={() => { setActiveIndex(idx); setZoom(1); }} 
            className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
              activeIndex === idx 
                ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20 z-10' 
                : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            <img src={src as string} className="w-full h-full object-cover" alt="thumb" />
            <div className={`absolute inset-0 bg-indigo-500/10 transition-opacity ${activeIndex === idx ? 'opacity-100' : 'opacity-0'}`}></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageGalleryModal;
