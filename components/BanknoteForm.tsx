
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
    if (!source) { alert("Carregue a imagem da frente."); return; }
    setIsExtracting(true);
    try {
      const data = await geminiService.extractBanknoteData(source);
      if (data) setFormData(prev => ({ ...prev, ...data }));
    } catch (e) { console.error(e); } finally { setIsExtracting(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800">Imagens</h2>
          <button type="button" onClick={handleAiExtraction} disabled={isExtracting} className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            {isExtracting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>} IA Auto-Preencher
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(['front', 'back', 'detail1', 'detail2'] as const).map(slot => (
            <ImageUploader key={slot} label={slot} image={formData.images[slot]} onChange={(b) => setFormData(p => ({ ...p, images: { ...p.images, [slot]: b }}))} />
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">País</label>
          <input name="country" value={formData.country} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Nominal</label>
          <input name="denomination" value={formData.denomination} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Moeda</label>
          <input name="currency" value={formData.currency} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Data/Ano</label>
          <input name="issueDate" value={formData.issueDate} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Pick/ID</label>
          <input name="pickId" value={formData.pickId} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Estado (Grade)</label>
          <select name="grade" value={formData.grade} onChange={handleChange} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400 font-bold">
            <option value="UNC">UNC (Flor de Estampa)</option>
            <option value="AU">AU (Quase F.E.)</option>
            <option value="XF">XF (Soberba)</option>
            <option value="VF">VF (Muito Bem Cons.)</option>
            <option value="F">F (Bem Conservada)</option>
            <option value="VG">VG (Muito Gasta)</option>
            <option value="G">G (Gasta/Pobre)</option>
          </select>
        </div>
        <div className="md:col-span-3 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Comentários</label>
          <textarea name="comments" value={formData.comments} onChange={handleChange} rows={3} className="bg-slate-50 p-3 rounded-xl outline-none border border-slate-100 focus:border-indigo-400" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl p-4 flex justify-center gap-4 z-50 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Descartar</button>
        <button type="submit" className="px-12 py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg">Salvar Registro</button>
      </div>
    </form>
  );
};

export default BanknoteForm;
