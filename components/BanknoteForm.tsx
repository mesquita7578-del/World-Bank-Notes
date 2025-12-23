
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
    size: initialData?.size || '',
    comments: initialData?.comments || '',
    images: initialData?.images || {},
    createdAt: initialData?.createdAt || Date.now(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (slot: keyof Banknote['images'], base64: string) => {
    setFormData(prev => ({
      ...prev,
      images: { ...prev.images, [slot]: base64 }
    }));
  };

  const handleAiExtraction = async () => {
    // Tenta usar a imagem da frente primeiro, se não houver, tenta qualquer outra
    const sourceImage = formData.images.front || formData.images.back || formData.images.detail1 || formData.images.detail2;
    
    if (!sourceImage) {
      alert("Por favor, carregue pelo menos uma imagem (preferencialmente a frente) para que a IA possa analisar.");
      return;
    }

    setIsExtracting(true);
    try {
      const extractedData = await geminiService.extractBanknoteData(sourceImage);
      if (extractedData) {
        setFormData(prev => ({
          ...prev,
          ...extractedData,
          // Mantém as imagens originais e ID
          images: prev.images,
          id: prev.id,
          createdAt: prev.createdAt
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao extrair dados. Verifique sua conexão e chave de API.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const InputField = ({ label, name, type = "text", placeholder = "" }: { label: string, name: keyof Banknote, type?: string, placeholder?: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        placeholder={placeholder}
        className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-slate-50/50"
        required={['country', 'currency', 'denomination'].includes(name)}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* Seção de Imagens primeiro para facilitar a extração */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <i className="fa-solid fa-images text-indigo-500"></i>
            Galeria de Imagens
          </h2>
          <button
            type="button"
            onClick={handleAiExtraction}
            disabled={isExtracting}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isExtracting 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-indigo-100'
            }`}
          >
            {isExtracting ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin"></i>
                Lendo Cédula...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-sparkles"></i>
                Preencher Dados com IA
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImageUploader 
            label="Frente" 
            image={formData.images.front} 
            onChange={(b) => handleImageChange('front', b)} 
          />
          <ImageUploader 
            label="Verso" 
            image={formData.images.back} 
            onChange={(b) => handleImageChange('back', b)} 
          />
          <ImageUploader 
            label="Detalhe 1" 
            image={formData.images.detail1} 
            onChange={(b) => handleImageChange('detail1', b)} 
          />
          <ImageUploader 
            label="Detalhe 2" 
            image={formData.images.detail2} 
            onChange={(b) => handleImageChange('detail2', b)} 
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest text-center">
          Dica: Carregue a imagem da frente e clique em "Preencher Dados com IA" para economizar tempo.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <i className="fa-solid fa-file-invoice text-indigo-500"></i>
          Especificações Técnicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <InputField label="Identificação (Pick/ID)" name="pickId" placeholder="Ex: P-123a" />
          <InputField label="País" name="country" placeholder="Ex: Brasil" />
          <InputField label="Autoridade" name="authority" placeholder="Ex: Banco Central do Brasil" />
          <InputField label="Moeda" name="currency" placeholder="Ex: Cruzeiros" />
          <InputField label="Denominação" name="denomination" placeholder="Ex: 1000" />
          <InputField label="Data de Emissão" name="issueDate" placeholder="Ex: 1986" />
          <InputField label="Itens no Conjunto" name="itemsInSet" />
          <InputField label="Nº do Item no Conjunto" name="setItemNumber" />
          <InputField label="Detalhes do Conjunto" name="setDetails" />
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Material</label>
            <select 
              name="material" 
              value={formData.material} 
              onChange={handleChange} 
              className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 font-medium"
            >
              <option value="Papel">Papel</option>
              <option value="Polímero">Polímero</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange} 
              className="border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 font-medium"
            >
              <option value="Circulação">Circulação Regular</option>
              <option value="Comemorativa">Comemorativa</option>
              <option value="Espécime">Espécime</option>
              <option value="Prova">Prova</option>
              <option value="Local">Emissão Local</option>
            </select>
          </div>

          <InputField label="Tamanho" name="size" placeholder="Ex: 154 x 74 mm" />

          <div className="flex flex-col gap-1 lg:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comentários e Observações</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva marcas d'água, assinaturas, estado de conservação..."
              className="border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Barra de Ações Fixa */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-5 flex justify-center gap-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
        >
          Descartar
        </button>
        <button 
          type="submit" 
          className="px-12 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <i className="fa-solid fa-check-double"></i>
          Finalizar Cadastro
        </button>
      </div>
    </form>
  );
};

export default BanknoteForm;
