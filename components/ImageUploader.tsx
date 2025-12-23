
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';

interface ImageUploaderProps {
  label: string;
  image?: string;
  onChange: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, image, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEdit = async () => {
    if (!image || !prompt) return;
    setIsLoading(true);
    try {
      const edited = await geminiService.editImage(image, prompt);
      if (edited) {
        onChange(edited);
        setIsEditing(false);
        setPrompt('');
      }
    } catch (err) {
      alert("Erro ao editar imagem com AI. Verifique sua chave de API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
      <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</span>
      
      <div className="relative aspect-[4/3] w-full bg-slate-50 rounded-lg overflow-hidden border-2 border-dashed border-slate-200 group flex items-center justify-center">
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-slate-800 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <i className="fa-solid fa-camera"></i>
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-plus text-3xl"></i>
            <span className="text-sm">Adicionar Imagem</span>
          </button>
        )}
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={handleFileChange}
      />

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
              Editor de IA - Nano Banana
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              Descreva a alteração que deseja fazer (ex: "Aumentar nitidez", "Limpar manchas", "Filtro retro").
            </p>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Melhore o contraste e remova o fundo..."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAiEdit}
                disabled={isLoading || !prompt}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-bolt"></i>
                )}
                Aplicar IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
