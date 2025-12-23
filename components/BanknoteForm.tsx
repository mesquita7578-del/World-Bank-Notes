
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
    if (!source) { 
      alert("Por favor, carregue a imagem da frente da cédula primeiro para que a IA possa analisá-la."); 
      return; 
    }
    setIsExtracting(true);
    try {
      // O novo método faz tudo de uma vez
      const data = await geminiService.extractBanknoteData(source);
      if (data) {
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (e) { 
      console.error(e); 
      alert("Houve um problema na super-identificação. Verifique sua conexão e tente novamente.");
    } finally { 
      setIsExtracting(false); 
    }
  };

  const handleAutoValuation = async () => {
    if (!formData.country || !formData.denomination) {
      alert("Preencha ao menos o País e a Denominação antes de consultar o valor.");
      return;
    }
    setIsValuing(true);
    try {
      const value = await geminiService.estimateMarketValue(formData);
      if (value) {
        setFormData(prev => ({ ...prev, estimatedValue: value }));
      } else {
        alert("A IA não conseguiu encontrar um valor de mercado preciso para este item no momento.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao consultar cotação.");
    } finally {
      setIsValuing(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Seção de Imagens */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-images text-indigo-500"></i>
              Acervo de Imagens
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Carregue a frente para identificação automática</p>
          </div>
          <button 
            type="button" 
            onClick={handleAiExtraction} 
            disabled={isExtracting} 
            className="group relative bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95 overflow-hidden"
          >
            {isExtracting ? (
              <>
                <i className="fa-solid fa-sync animate-spin"></i>
                <span>Processando Super-Busca...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles group-hover:rotate-12 transition-transform"></i>
                <span>Super Identificação & Valor (IA)</span>
              </>
            )}
            {isExtracting && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
          </button>
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação da Escolha (Pick)</label>
          <input name="pickId" value={formData.pickId} onChange={handleChange} placeholder="Ex: P-123a" className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">País</label>
          <input name="country" value={formData.country} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" required />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autoridade Emissora</label>
          <input name="authority" value={formData.authority} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
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
      </div>

      {/* Especificações Técnicas e Avaliação */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
        <h2 className="text-2xl font-black text-slate-800 md:col-span-3 mb-4 flex items-center gap-3">
          <i className="fa-solid fa-microscope text-indigo-500"></i>
          Especificações Técnicas & Avaliação
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado (Grade)</label>
          <select name="grade" value={formData.grade} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-black">
            <option value="UNC">UNC (Flor de Estampa)</option>
            <option value="AU">AU (Quase FE)</option>
            <option value="XF">XF (Soberba)</option>
            <option value="VF">VF (MBC)</option>
            <option value="F">F (BC)</option>
            <option value="VG">VG (Muito Gasta)</option>
            <option value="G">G (Gasta/Pobre)</option>
            <option value="SPECIMEN">SPECIMEN</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Comercial (€)</label>
            <button 
              type="button" 
              onClick={handleAutoValuation} 
              disabled={isValuing}
              className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800 transition-colors disabled:opacity-50"
            >
              {isValuing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rotate"></i>}
              Recalcular Valor
            </button>
          </div>
          <div className="relative group">
            <input 
              name="estimatedValue" 
              type="number" 
              step="0.01" 
              value={formData.estimatedValue} 
              onChange={handleChange} 
              placeholder="0.00" 
              className={`w-full bg-emerald-50 p-4 rounded-2xl outline-none border border-emerald-100 focus:border-emerald-500 font-black text-emerald-700 transition-all ${isValuing || isExtracting ? 'opacity-50' : ''}`} 
            />
            {(isValuing || isExtracting) && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-600 animate-pulse">
                {isExtracting ? 'IDENTIFICANDO VALOR...' : 'ATUALIZANDO COTAÇÃO...'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</label>
          <select name="material" value={formData.material} onChange={handleChange} className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold">
            <option value="Papel">Papel</option>
            <option value="Polímero">Polímero</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>

        <div className="md:col-span-1 flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamanho (mm)</label>
          <input name="size" value={formData.size} onChange={handleChange} placeholder="Ex: 140x70" className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Conjunto / Série</label>
          <input name="setDetails" value={formData.setDetails} onChange={handleChange} placeholder="Série identificada automaticamente..." className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" />
        </div>

        <div className="md:col-span-3 flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentários & Notas Históricas (Auto)</label>
          <textarea name="comments" value={formData.comments} onChange={handleChange} rows={3} placeholder="A IA preencherá curiosidades aqui..." className="bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:border-indigo-500 font-medium" />
        </div>
      </div>

      {/* Ações Inferiores */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl p-6 flex justify-center gap-6 z-50 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-10 py-4 text-slate-500 font-black hover:bg-slate-100 rounded-2xl transition-all">Descartar</button>
        <button type="submit" className="px-16 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all transform active:scale-95 flex items-center gap-3">
          <i className="fa-solid fa-cloud-arrow-up"></i>
          Salvar no Banco de Dados
        </button>
      </div>
    </form>
  );
};

export default BanknoteForm;
