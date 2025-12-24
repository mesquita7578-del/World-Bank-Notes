
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Banknote } from './types';
import BanknoteForm from './components/BanknoteForm';
import ImageGalleryModal from './components/ImageGalleryModal';
import { dbService } from './services/db';

const CONTINENTS = [
  { name: 'África', icon: 'fa-solid fa-earth-africa' },
  { name: 'América', icon: 'fa-solid fa-earth-americas' },
  { name: 'Ásia', icon: 'fa-solid fa-earth-asia' },
  { name: 'Europa', icon: 'fa-solid fa-earth-europe' },
  { name: 'Oceania', icon: 'fa-solid fa-earth-oceania' }
];

const App: React.FC = () => {
  const [notes, setNotes] = useState<Banknote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'country' | 'val'>('date');
  const [filterMaterial, setFilterMaterial] = useState('Todos');
  const [filterGrade, setFilterGrade] = useState('Todos');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewGalleryNoteId, setViewGalleryNoteId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        await dbService.init();
        const data = await dbService.getAll();
        setNotes(data);
      } catch (e) {
        console.error("Erro ao inicializar DB:", e);
      } finally {
        setLoading(false);
      }
    };
    initDB();
  }, []);

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => {
      const matchSearch = (n.country || '').toLowerCase().includes(search.toLowerCase()) ||
                          (n.currency || '').toLowerCase().includes(search.toLowerCase()) ||
                          (n.pickId || '').toLowerCase().includes(search.toLowerCase()) ||
                          (n.denomination || '').toLowerCase().includes(search.toLowerCase());
      const matchMaterial = filterMaterial === 'Todos' || n.material === filterMaterial;
      const matchGrade = filterGrade === 'Todos' || n.grade === filterGrade;
      const matchContinent = !selectedContinent || n.continent === selectedContinent;
      
      return matchSearch && matchMaterial && matchGrade && matchContinent;
    });

    if (sortBy === 'country') result.sort((a, b) => (a.country || '').localeCompare(b.country || ''));
    else if (sortBy === 'val') result.sort((a, b) => parseFloat(b.denomination || '0') - parseFloat(a.denomination || '0'));
    else result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [notes, search, sortBy, filterMaterial, filterGrade, selectedContinent]);

  const stats = useMemo(() => {
    return {
      total: notes.length,
      countries: new Set(notes.map(n => n.country)).size,
      value: notes.reduce((acc, n) => acc + (parseFloat(n.estimatedValue) || 0), 0)
    };
  }, [notes]);

  const handleAddOrEdit = async (note: Banknote) => {
    await dbService.save(note);
    if (editingId) setNotes(prev => prev.map(n => n.id === editingId ? note : n));
    else setNotes(prev => [note, ...prev]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleUpdateNote = async (updatedNote: Banknote) => {
    await dbService.save(updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir registro permanentemente?')) {
      await dbService.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `backup-numis-${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          for (const note of json) await dbService.save(note);
          const all = await dbService.getAll();
          setNotes(all);
        }
      } catch (err) { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-vault text-6xl animate-bounce text-indigo-500"></i>
          <p className="font-black tracking-[0.3em] text-[10px] uppercase">Sincronizando Arquivos Globais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      {/* Sidebar de Continentes */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0f172a] text-white fixed h-full z-50 border-r border-slate-800 shadow-2xl">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><i className="fa-solid fa-globe text-xl"></i></div>
            <h1 className="text-xl font-black tracking-tighter">NUMIS-WORLD</h1>
          </div>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Global Archive Database</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setSelectedContinent(null)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all ${!selectedContinent ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 text-white scale-105' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <i className="fa-solid fa-border-all text-lg"></i>
            <span className="text-xs uppercase tracking-widest">Todos os Países</span>
          </button>

          <div className="h-4"></div>
          <h3 className="text-[9px] font-black text-slate-500 uppercase px-6 mb-2 tracking-[0.2em]">Por Continente</h3>

          {CONTINENTS.map(cont => (
            <button 
              key={cont.name}
              onClick={() => setSelectedContinent(cont.name)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all ${selectedContinent === cont.name ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40 text-white scale-105' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <i className={`${cont.icon} text-lg`}></i>
              <span className="text-xs uppercase tracking-widest">{cont.name}</span>
              <div className="ml-auto bg-slate-800 px-2 py-0.5 rounded-full text-[8px]">
                {notes.filter(n => n.continent === cont.name).length}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl">
            <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Total do Acervo</p>
            <p className="text-lg font-black text-indigo-400">{stats.value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col pb-24">
        {/* Header Superior */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Pesquisar por país, moeda ou pick..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleExport} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50" title="Exportar"><i className="fa-solid fa-download"></i></button>
              <button onClick={() => fileImportRef.current?.click()} className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50" title="Importar"><i className="fa-solid fa-upload"></i></button>
              <input type="file" ref={fileImportRef} className="hidden" accept=".json" onChange={handleImport} />
              
              <button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95">
                <i className="fa-solid fa-plus-circle"></i> Novo Item
              </button>
            </div>
          </div>
        </header>

        {/* Listagem de Continentes Horizontal para Mobile */}
        <div className="lg:hidden flex overflow-x-auto p-4 gap-3 bg-white border-b border-slate-200 no-scrollbar">
          <button onClick={() => setSelectedContinent(null)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${!selectedContinent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
          {CONTINENTS.map(c => (
            <button key={c.name} onClick={() => setSelectedContinent(c.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${selectedContinent === c.name ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid de Cédulas */}
        {!isAdding && !editingId && (
          <div className="max-w-7xl mx-auto px-8 mt-8 w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                  {selectedContinent || 'Acervo Global'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                  Exibindo {filteredNotes.length} de {notes.length} cédulas registradas
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col px-3">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Ordem</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-[10px] font-black text-slate-700 outline-none bg-transparent uppercase">
                    <option value="date">Recentes</option><option value="country">País</option><option value="val">Valor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => setViewGalleryNoteId(note.id)}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden cursor-pointer"
                >
                  <div className="aspect-[1.5/1] bg-slate-50 relative">
                    {note.images.front ? (
                      <img src={note.images.front} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-200"><i className="fa-solid fa-panorama text-4xl"></i></div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(note.id); setIsAdding(true); }} className="w-10 h-10 bg-white/90 backdrop-blur text-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-sm"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="w-10 h-10 bg-white/90 backdrop-blur text-rose-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-sm"></i></button>
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] text-white font-black border border-white/20">{note.pickId || 'S/ID'}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                       <div className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{note.country}</div>
                       <div className="text-[9px] text-slate-400 font-bold">{note.grade}</div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-4 truncate">{note.denomination} {note.currency}</h3>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400">{note.issueDate}</span>
                      <span className="text-sm font-black text-emerald-600">{(parseFloat(note.estimatedValue) || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isAdding || editingId) && (
          <div className="max-w-4xl mx-auto px-8 mt-12 w-full">
            <BanknoteForm 
              initialData={editingId ? notes.find(n => n.id === editingId) : undefined} 
              onSubmit={handleAddOrEdit} 
              onCancel={() => { setIsAdding(false); setEditingId(null); }} 
            />
          </div>
        )}
      </main>

      {viewGalleryNoteId && (
        <ImageGalleryModal 
          note={notes.find(n => n.id === viewGalleryNoteId)!} 
          onClose={() => setViewGalleryNoteId(null)} 
          onUpdateNote={handleUpdateNote} 
        />
      )}
    </div>
  );
};

export default App;
