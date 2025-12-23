
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Banknote } from './types';
import BanknoteForm from './components/BanknoteForm';
import ImageGalleryModal from './components/ImageGalleryModal';

const STORAGE_KEY = 'banknote_archive_data_v2';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Banknote[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'country' | 'val'>('date');
  const [filterMaterial, setFilterMaterial] = useState('Todos');
  const [filterGrade, setFilterGrade] = useState('Todos');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewGalleryNoteId, setViewGalleryNoteId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Efeito para detectar se o app pode ser instalado (PWA)
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNotes(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Para instalar no PC:\n1. Use o Chrome ou Edge\n2. Clique no ícone de 'Instalar' na barra de endereços (ao lado da estrela de favoritos).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => {
      const matchSearch = n.country.toLowerCase().includes(search.toLowerCase()) ||
                          n.currency.toLowerCase().includes(search.toLowerCase()) ||
                          n.pickId.toLowerCase().includes(search.toLowerCase()) ||
                          n.denomination.toLowerCase().includes(search.toLowerCase());
      const matchMaterial = filterMaterial === 'Todos' || n.material === filterMaterial;
      const matchGrade = filterGrade === 'Todos' || n.grade === filterGrade;
      
      return matchSearch && matchMaterial && matchGrade;
    });

    if (sortBy === 'country') result.sort((a, b) => a.country.localeCompare(b.country));
    else if (sortBy === 'val') result.sort((a, b) => parseFloat(b.denomination) - parseFloat(a.denomination));
    else result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [notes, search, sortBy, filterMaterial, filterGrade]);

  const stats = useMemo(() => ({
    total: notes.length,
    countries: new Set(notes.map(n => n.country)).size,
    value: notes.reduce((acc, n) => acc + (parseFloat(n.estimatedValue) || 0), 0)
  }), [notes]);

  const handleAddOrEdit = (note: Banknote) => {
    if (editingId) setNotes(prev => prev.map(n => n.id === editingId ? note : n));
    else setNotes(prev => [note, ...prev]);
    setIsAdding(false);
    setEditingId(null);
  };

  // Fixed: Added handleUpdateNote to handle updates from the gallery modal (e.g. image rotation)
  const handleUpdateNote = (updatedNote: Banknote) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir permanentemente?')) setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup-numis-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 print:bg-white print:pb-0">
      <header className="sticky top-0 z-40 bg-[#0f172a] text-white shadow-2xl px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-inner shadow-indigo-400/20">
              <i className="fa-solid fa-vault text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">NUMIS-ARCHIVE</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">PRO Database v2</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input 
                type="text" 
                placeholder="Pesquisar acervo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleInstallClick} className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-emerald-900/20">
              <i className="fa-solid fa-laptop-arrow-down"></i>
              {deferredPrompt ? 'Instalar App no PC' : 'App Desktop'}
            </button>
            <div className="h-8 w-[1px] bg-slate-700 mx-1"></div>
            <button onClick={handleExport} title="Backup" className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"><i className="fa-solid fa-download"></i></button>
            <button onClick={() => setIsAdding(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95">
              <i className="fa-solid fa-plus-circle"></i> Novo Registro
            </button>
          </div>
        </div>
      </header>

      {!isAdding && !editingId && (
        <div className="max-w-7xl mx-auto px-6 mt-6 print:hidden">
          {/* Dashboard Superior */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex gap-4">
              <div className="bg-white p-4 pr-12 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cédulas</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{stats.total}</p>
              </div>
              <div className="bg-white p-4 pr-12 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Países</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{stats.countries}</p>
              </div>
              <div className="bg-indigo-50 p-4 pr-12 rounded-2xl border border-indigo-100 shadow-sm">
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Valor Total</p>
                <p className="text-2xl font-black text-indigo-700 leading-none">{stats.value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>

            {/* Toolbar de Filtros */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col px-3">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1">Ordenar</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs font-bold text-slate-700 outline-none bg-transparent">
                  <option value="date">Data de Inclusão</option>
                  <option value="country">País (A-Z)</option>
                  <option value="val">Valor Nominal</option>
                </select>
              </div>
              <div className="h-8 w-[1px] bg-slate-100"></div>
              <div className="flex flex-col px-3">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1">Material</label>
                <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)} className="text-xs font-bold text-slate-700 outline-none bg-transparent">
                  <option value="Todos">Todos</option>
                  <option value="Papel">Papel</option>
                  <option value="Polímero">Polímero</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div className="h-8 w-[1px] bg-slate-100"></div>
              <div className="flex flex-col px-3">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1">Conservação</label>
                <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="text-xs font-bold text-slate-700 outline-none bg-transparent">
                  <option value="Todos">Todos</option>
                  <option value="UNC">UNC (FE)</option>
                  <option value="AU">AU (Quase FE)</option>
                  <option value="XF">XF (Soberba)</option>
                  <option value="VF">VF (MBC)</option>
                  <option value="F">F (BC)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {filteredNotes.map(note => (
              <div key={note.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all group overflow-hidden flex flex-col cursor-pointer" onClick={() => setViewGalleryNoteId(note.id)}>
                <div className="aspect-[1.6/1] bg-slate-100 relative overflow-hidden">
                  {note.images.front ? <img src={note.images.front} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="flex items-center justify-center h-full text-slate-200"><i className="fa-solid fa-panorama text-4xl"></i></div>}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(note.id); }} className="w-8 h-8 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-xs"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="w-8 h-8 bg-white text-rose-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] text-white font-black z-10 border border-white/10">{note.pickId || 'S/ID'}</div>
                  {note.grade && <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black z-10 shadow-lg border border-indigo-400/30">{note.grade}</div>}
                </div>
                <div className="p-4 flex-1">
                  <div className="text-[9px] text-indigo-500 font-black uppercase mb-1 flex items-center gap-1">
                    <i className="fa-solid fa-location-dot scale-75"></i>
                    {note.country}
                  </div>
                  <h3 className="text-base font-black text-slate-800 leading-none mb-1 truncate">{note.denomination} {note.currency}</h3>
                  <div className="flex justify-between items-end mt-3">
                    <p className="text-[10px] text-slate-400 font-bold">{note.issueDate || 'S/Data'}</p>
                    <p className="text-xs font-black text-emerald-600">{(parseFloat(note.estimatedValue) || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdding || editingId ? (
        <div className="max-w-4xl mx-auto px-6 mt-10">
           <BanknoteForm initialData={editingId ? notes.find(n => n.id === editingId) : undefined} onSubmit={handleAddOrEdit} onCancel={() => { setIsAdding(false); setEditingId(null); }} />
        </div>
      ) : null}

      {viewGalleryNoteId && <ImageGalleryModal note={notes.find(n => n.id === viewGalleryNoteId)!} onClose={() => setViewGalleryNoteId(null)} onUpdateNote={handleUpdateNote} />}
    </div>
  );
};

export default App;
