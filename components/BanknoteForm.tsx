
import React, { useState } from 'react';
import { Banknote } from '../types';
import { geminiService } from '../services/geminiService';
import ImageUploader from './ImageUploader';

interface BanknoteFormProps {
  initialData?: Partial<Banknote>;
  onSubmit: (note: Banknote) => void;
  onCancel: () => void;
}

const BanknoteForm: React.FC<BanknoteFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [formData, setFormData] = useState<Banknote>({
    id: initialData?.id || crypto.randomUUID(),
    pickId: initialData?.pickId || '',
    country: initialData?.country || '',
    authority: initialData?.authority || '',
    currency: initialData?.currency || '',
    denomination: initialData?.denomination || '',
    issueDate: initialData?.issueDate || '',
    itemsInSet: initialData?.itemsInSet || '',
    setItemNumber: initialData?.setItemNumber || '',
    setDetails: initialData?.setDetails || '',
    type: initialData?.type || 'Circulação',
    material: initialData?.material || 'Papel',
    grade: initialData?.grade || 'UNC',
    estimatedValue: initialData?.estimatedValue || '',
    size: initialData?.size || '',
    comments: initialData?.comments || '',
    images: initialData?.images || {},
    createdAt: initialData?.createdAt || Date.now(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAiExtraction = async () => {
    const source = formData.images.front || formData.images.back;
    if (!source) { alert("Carregue a imagem da frente primeiro."); return; }
    setIsExtracting(true);
    try {
      const data = await geminiService.extractBanknoteData(source);
      if (data) setFormData(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); } finally { setIsExtracting(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8 pb-32">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
             <i className="fa-solid fa-images text-indigo-500"></i>
             Galeria de Imagens
          </h2>
          <button type="button" onClick={handleAiExtraction} disabled={isExtracting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95">
            {isExtracting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>} 
            Auto-Preencher via IA
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {(['front', 'back', 'detail1', 'detail2'] as const).map(slot => (
            <ImageUploader key={slot} label={slot} image={formData.images[slot]} onChange={(b) => setFormData(p => ({ ...p, images: { ...p.images, [slot]: b }}))} />
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
        <h2 className="text-2xl font-black text-slate-800 md:col-span-3 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-list-check text-indigo-500"></i>
          Dados Técnicos
        </h2>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">País de Origem</label>
          <input name="country" value={formData.country} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" required />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moeda</label>
          <input name="currency" value={formData.currency} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Denominação</label>
          <input name="denomination" value={formData.denomination} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Ano</label>
          <input name="issueDate" value={formData.issueDate} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação (Pick)</label>
          <input name="pickId" value={formData.pickId} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Estimado (€)</label>
          <input name="estimatedValue" type="number" step="0.01" value={formData.estimatedValue} onChange={handleChange} placeholder="0.00" className="bg-emerald-50 p-4 rounded-2xl outline-none border border-emerald-100 focus:border-emerald-500 font-black text-emerald-700 transition-all" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Conservação</label>
          <select name="grade" value={formData.grade} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-black transition-all">
            <option value="UNC">UNC (Flor de Estampa)</option>
            <option value="AU">AU (Quase FE)</option>
            <option value="XF">XF (Soberba)</option>
            <option value="VF">VF (MBC)</option>
            <option value="F">F (BC)</option>
            <option value="VG">VG (Muito Gasta)</option>
            <option value="G">G (Gasta/Pobre)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</label>
          <select name="material" value={formData.material} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all">
            <option value="Papel">Papel</option>
            <option value="Polímero">Polímero</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamanho (mm)</label>
          <input name="size" value={formData.size} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold transition-all" />
        </div>

        <div className="md:col-span-3 flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações Extras</label>
          <textarea name="comments" value={formData.comments} onChange={handleChange} rows={4} className="bg-slate-50 p-6 rounded-[2rem] outline-none border border-slate-100 focus:border-indigo-500 transition-all font-medium" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl p-6 flex justify-center gap-6 z-50 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-10 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-all">Descartar</button>
        <button type="submit" className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all transform active:scale-95 flex items-center gap-3">
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Finalizar Registro
        </button>
      </div>
    </form>
  );
};

export default BanknoteForm;
