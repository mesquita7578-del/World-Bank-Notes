
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Banknote } from './types';
import BanknoteForm from './components/BanknoteForm';
import ImageGalleryModal from './components/ImageGalleryModal';

const STORAGE_KEY = 'banknote_archive_data';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Banknote[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewGalleryNoteId, setViewGalleryNoteId] = useState<string | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Falha ao carregar dados", e);
      }
    }
  }, []);

  // Salvar dados sempre que houver alteração
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      n.currency.toLowerCase().includes(search.toLowerCase()) ||
      n.pickId.toLowerCase().includes(search.toLowerCase()) ||
      n.denomination.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, search]);

  const stats = useMemo(() => {
    const countries = new Set(notes.map(n => n.country)).size;
    return {
      total: notes.length,
      countries: countries
    };
  }, [notes]);

  const handleAddOrEdit = (note: Banknote) => {
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? note : n));
    } else {
      setNotes(prev => [note, ...prev]);
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const handleUpdateNote = (updatedNote: Banknote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro permanentemente?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-numismatica-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && window.confirm('Deseja substituir sua base atual pelos dados importados?')) {
          setNotes(json);
        }
      } catch (err) {
        alert('Erro ao importar arquivo JSON. Certifique-se que o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  const editingNote = editingId ? notes.find(n => n.id === editingId) : undefined;
  const galleryNote = viewGalleryNoteId ? notes.find(n => n.id === viewGalleryNoteId) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Profissional */}
      <header className="sticky top-0 z-40 bg-[#0f172a] text-white shadow-2xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-inner">
              <i className="fa-solid fa-vault text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">NUMIS-ARCHIVE</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Global Banknote Database</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors"></i>
              <input 
                type="text" 
                placeholder="Pesquise por país, moeda, pick ou denominação..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              title="Exportar Base de Dados"
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <i className="fa-solid fa-download"></i>
            </button>
            <button 
              onClick={() => fileImportRef.current?.click()}
              title="Importar Base de Dados"
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <i className="fa-solid fa-upload"></i>
            </button>
            <input type="file" ref={fileImportRef} className="hidden" accept=".json" onChange={handleImport} />
            <div className="h-8 w-[1px] bg-slate-700 mx-2 hidden lg:block"></div>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <i className="fa-solid fa-plus-circle"></i>
              Registrar Nota
            </button>
          </div>
        </div>
      </header>

      {/* Painel de Estatísticas Rápido */}
      {!isAdding && !editingId && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="bg-white p-3 pr-8 rounded-xl border border-slate-200 shadow-sm min-w-max">
              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5 tracking-wider">Total de Notas</p>
              <p className="text-xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white p-3 pr-8 rounded-xl border border-slate-200 shadow-sm min-w-max">
              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5 tracking-wider">Países Catalogados</p>
              <p className="text-xl font-black text-slate-800">{stats.countries}</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {isAdding || editingId ? (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 leading-none">
                  {editingId ? 'Editar Registro' : 'Novo Cadastro'}
                </h2>
                <p className="text-slate-500 mt-2">Preencha os detalhes técnicos da cédula e anexe as imagens.</p>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <BanknoteForm 
              initialData={editingNote}
              onSubmit={handleAddOrEdit}
              onCancel={() => { setIsAdding(false); setEditingId(null); }}
            />
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                <i className="fa-solid fa-layer-group text-indigo-400"></i>
                Catálogo ({filteredNotes.length})
              </h2>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-24 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <i className="fa-solid fa-magnifying-glass text-3xl text-slate-200"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Sem resultados</h3>
                <p className="text-sm text-slate-500 max-w-xs mb-8">Não encontramos registros para sua busca. Adicione novas notas para expandir sua coleção.</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Adicionar Nota
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col">
                    {/* Preview da Imagem Compacto */}
                    <div className="aspect-[1.5/1] bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => setViewGalleryNoteId(note.id)}>
                      {note.images.front ? (
                        <img src={note.images.front} alt={note.pickId} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-200">
                          <i className="fa-solid fa-panorama text-3xl"></i>
                        </div>
                      )}
                      
                      {/* Overlay Simplificado */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2">
                        <i className="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all text-xl drop-shadow-md"></i>
                      </div>

                      {/* Botões de Ação Rápidos */}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(note.id); }}
                          className="w-7 h-7 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                          className="w-7 h-7 bg-white/90 backdrop-blur-sm text-rose-600 rounded-lg flex items-center justify-center shadow-md hover:bg-rose-600 hover:text-white transition-all"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </div>

                      {/* Pick ID Compacto */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[8px] text-white font-black tracking-tight z-10">
                        {note.pickId || 'S/ID'}
                      </div>
                    </div>
                    
                    {/* Info Reduzida mas Completa */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 text-[8px] text-indigo-500 font-black uppercase tracking-wider mb-0.5 truncate">
                        <i className="fa-solid fa-globe scale-75"></i>
                        {note.country}
                      </div>
                      <h3 className="text-sm font-black text-slate-800 leading-tight mb-0.5 truncate" title={`${note.denomination} ${note.currency}`}>
                        {note.denomination} {note.currency}
                      </h3>
                      <p className="text-[9px] text-slate-400 font-medium truncate mb-2">
                        {note.issueDate || 'S/ Data'} • {note.material}
                      </p>
                      
                      <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[8px] text-slate-300 font-bold uppercase truncate max-w-[50px]">
                          {note.type}
                        </span>
                        <div className="flex -space-x-1.5">
                          {Object.entries(note.images).filter(([_, v]) => !!v).slice(0, 3).map(([key, src], i) => (
                            <button 
                              key={key} 
                              onClick={(e) => { e.stopPropagation(); setViewGalleryNoteId(note.id); }}
                              className="w-5 h-5 rounded-full border border-white bg-slate-200 overflow-hidden hover:z-20 transition-all shadow-sm"
                            >
                              <img src={src} className="w-full h-full object-cover" alt="thumb" />
                            </button>
                          ))}
                          {Object.values(note.images).filter(Boolean).length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-white bg-slate-800 text-[6px] text-white flex items-center justify-center font-bold">
                              +{Object.values(note.images).filter(Boolean).length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Galeria */}
      {galleryNote && (
        <ImageGalleryModal 
          note={galleryNote} 
          onClose={() => setViewGalleryNoteId(null)} 
          onUpdateNote={handleUpdateNote}
        />
      )}

      <footer className="bg-slate-900 text-slate-500 py-10 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h4 className="text-white font-black tracking-tighter text-md mb-2">NUMIS-ARCHIVE</h4>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-6 opacity-40">Global Banknote Database</p>
          <p className="text-xs max-w-md mx-auto mb-8 opacity-60">Catalogação profissional e restauração digital via Inteligência Artificial Gemini 2.5 Flash.</p>
          <div className="h-[1px] w-12 bg-indigo-500/30 mx-auto mb-8"></div>
          <p className="text-[10px] opacity-30">© 2024 - Sistema de Gerenciamento Numismático</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
