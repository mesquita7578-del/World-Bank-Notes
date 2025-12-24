
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
  const [isValuing, setIsValuing] = useState(false);
  const [formData, setFormData] = useState<Banknote>({
    id: initialData?.id || crypto.randomUUID(),
    pickId: initialData?.pickId || '',
    country: initialData?.country || '',
    continent: initialData?.continent || '',
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
    minister: initialData?.minister || '',
    president: initialData?.president || '',
    stamp: initialData?.stamp || '',
    seriesNormal: initialData?.seriesNormal || '',
    seriesReplacement: initialData?.seriesReplacement || '',
    images: initialData?.images || {},
    createdAt: initialData?.createdAt || Date.now(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAiExtraction = async () => {
    const source = formData.images.front || formData.images.back;
    if (!source) { 
      alert("Carregue a imagem da frente primeiro."); 
      return; 
    }
    setIsExtracting(true);
    try {
      const data = await geminiService.extractBanknoteData(source);
      if (data) setFormData(prev => ({ ...prev, ...data }));
    } catch (e) { 
      alert("Erro na super-identificação.");
    } finally { setIsExtracting(false); }
  };

  const handleAutoValuation = async () => {
    if (!formData.country || !formData.denomination) {
      alert("Preencha País e Denominação.");
      return;
    }
    setIsValuing(true);
    try {
      const value = await geminiService.estimateMarketValue(formData);
      if (value) setFormData(prev => ({ ...prev, estimatedValue: value }));
    } catch (e) { alert("Erro ao consultar valor."); }
    finally { setIsValuing(false); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Seção de Imagens */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-images text-indigo-500"></i>
              Acervo de Imagens
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Imagens para Identificação</p>
          </div>
          
          {isExtracting ? (
            <div className="w-full md:w-80 bg-slate-100 h-14 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-200">
               <div className="absolute inset-y-0 left-0 bg-indigo-600 animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
               <span className="relative z-10 text-[11px] font-black text-slate-700 uppercase tracking-widest">IA Analisando...</span>
            </div>
          ) : (
            <button type="button" onClick={handleAiExtraction} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Super Identificação (IA)</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {(['front', 'back', 'detail1', 'detail2'] as const).map(slot => (
            <ImageUploader key={slot} label={slot} image={formData.images[slot]} onChange={(b) => setFormData(p => ({ ...p, images: { ...p.images, [slot]: b }}))} />
          ))}
        </div>
      </div>

      {/* Identificação Principal */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
        <h2 className="text-2xl font-black text-slate-800 md:col-span-3 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-id-card text-indigo-500"></i>
          Identificação Principal
        </h2>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pick ID</label>
          <input name="pickId" value={formData.pickId} onChange={handleChange} placeholder="P-123" className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">País</label>
          <input name="country" value={formData.country} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Continente</label>
          <select name="continent" value={formData.continent} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-black">
            <option value="">Selecione...</option>
            <option value="África">África</option>
            <option value="América">América</option>
            <option value="Ásia">Ásia</option>
            <option value="Europa">Europa</option>
            <option value="Oceania">Oceania</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moeda</label>
          <input name="currency" value={formData.currency} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Denominação</label>
          <input name="denomination" value={formData.denomination} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Emissão</label>
          <input name="issueDate" value={formData.issueDate} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estampa</label>
          <input name="stamp" value={formData.stamp} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Série Normal</label>
          <input name="seriesNormal" value={formData.seriesNormal} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Série Reposição</label>
          <input name="seriesReplacement" value={formData.seriesReplacement} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ministro(a) Fazenda</label>
          <input name="minister" value={formData.minister} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presidente BC</label>
          <input name="president" value={formData.president} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autoridade</label>
          <input name="authority" value={formData.authority} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
        <h2 className="text-2xl font-black text-slate-800 md:col-span-3 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-microscope text-indigo-500"></i>
          Técnico & Valor
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado (Grade)</label>
          <select name="grade" value={formData.grade} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-black">
            <option value="UNC">UNC</option><option value="AU">AU</option><option value="XF">XF</option>
            <option value="VF">VF</option><option value="F">F</option><option value="SPECIMEN">SPECIMEN</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (€)</label>
            <button type="button" onClick={handleAutoValuation} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1">
              {isValuing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rotate"></i>}
              Recalcular
            </button>
          </div>
          <input name="estimatedValue" type="number" step="0.01" value={formData.estimatedValue} onChange={handleChange} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 font-black text-emerald-700" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</label>
          <select name="material" value={formData.material} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl font-bold">
            <option value="Papel">Papel</option><option value="Polímero">Polímero</option><option value="Híbrido">Híbrido</option>
          </select>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl p-6 flex justify-center gap-6 z-50 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-10 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-all">Descartar</button>
        <button type="submit" className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3">
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Salvar Registro
        </button>
      </div>
    </form>
  );
};

export default BanknoteForm;
