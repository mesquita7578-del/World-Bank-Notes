
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
        <div className="max-w-7xl mx-auto px-6 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total de Notas</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase mb-1">Países</p>
              <p className="text-2xl font-black text-slate-800">{stats.countries}</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
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
          <div className="mt-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-3">
                <i className="fa-solid fa-list-ul text-indigo-500"></i>
                Catálogo Atual ({filteredNotes.length})
              </h2>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-24 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <i className="fa-solid fa-magnifying-glass text-4xl text-slate-200"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Nada por aqui ainda</h3>
                <p className="text-slate-500 max-w-sm mb-8">Sua base de dados está vazia ou o filtro não retornou resultados. Vamos começar?</p>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  Adicionar Nota Nº 1
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col">
                    {/* Preview da Imagem */}
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => setViewGalleryNoteId(note.id)}>
                      {note.images.front ? (
                        <img src={note.images.front} alt={note.pickId} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-200">
                          <i className="fa-solid fa-panorama text-5xl"></i>
                        </div>
                      )}
                      
                      {/* Overlay de Ações */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                         <button 
                          onClick={(e) => { e.stopPropagation(); setViewGalleryNoteId(note.id); }}
                          className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-500 hover:text-white transition-all"
                        >
                          <i className="fa-solid fa-expand"></i>
                        </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(note.id); }}
                          className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      </div>

                      {/* Pick ID Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg text-[10px] text-slate-800 font-black shadow-sm z-10">
                        {note.pickId || 'SEM PICK'}
                      </div>
                    </div>
                    
                    {/* Info da Cédula */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-black uppercase tracking-[0.1em] mb-2">
                        <i className="fa-solid fa-globe"></i>
                        {note.country}
                      </div>
                      <h3 className="text-xl font-black text-slate-800 leading-none mb-1">
                        {note.denomination} {note.currency}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mb-4">
                        {note.issueDate || 'Data Indefinida'}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Material</span>
                          <span className="text-xs text-slate-700 font-bold">{note.material}</span>
                        </div>
                        <div className="flex -space-x-2.5">
                          {Object.entries(note.images).filter(([_, v]) => !!v).map(([key, src], i) => (
                            <button 
                              key={key} 
                              onClick={(e) => { e.stopPropagation(); setViewGalleryNoteId(note.id); }}
                              className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden hover:z-20 hover:scale-110 transition-all shadow-md"
                              title={key}
                            >
                              <img src={src} className="w-full h-full object-cover" alt="thumbnail" />
                            </button>
                          ))}
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
        />
      )}

      <footer className="bg-slate-900 text-slate-500 py-16 mt-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-black tracking-tight text-lg">NUMIS-ARCHIVE</h4>
            <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0">O sistema definitivo para catalogação e restauração digital de cédulas históricas e modernas.</p>
          </div>
          <div className="flex flex-col gap-4 items-center">
            <h4 className="text-white font-black tracking-tight text-lg">REDES SOCIAIS</h4>
            <div className="flex gap-6 text-2xl">
              <i className="fa-brands fa-instagram hover:text-white cursor-pointer transition-colors"></i>
              <i className="fa-brands fa-facebook hover:text-white cursor-pointer transition-colors"></i>
              <i className="fa-brands fa-linkedin hover:text-white cursor-pointer transition-colors"></i>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <h4 className="text-white font-black tracking-tight text-lg">TECNOLOGIA</h4>
            <p className="text-xs flex items-center gap-2 justify-center md:justify-end">
              Processado por <span className="text-indigo-400 font-bold">Gemini 2.5 Flash</span>
            </p>
            <p className="text-[10px] mt-4 opacity-50">© 2024 - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
