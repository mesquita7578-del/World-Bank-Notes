
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Banknote } from './types';
import BanknoteForm from './components/BanknoteForm';
import ImageGalleryModal from './components/ImageGalleryModal';

const STORAGE_KEY = 'banknote_archive_data';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Banknote[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'country' | 'val'>('date');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewGalleryNoteId, setViewGalleryNoteId] = useState<string | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNotes(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => 
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      n.currency.toLowerCase().includes(search.toLowerCase()) ||
      n.pickId.toLowerCase().includes(search.toLowerCase()) ||
      n.denomination.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'country') {
      result.sort((a, b) => a.country.localeCompare(b.country));
    } else if (sortBy === 'val') {
      result.sort((a, b) => parseFloat(b.denomination) - parseFloat(a.denomination));
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [notes, search, sortBy]);

  const stats = useMemo(() => ({
    total: notes.length,
    countries: new Set(notes.map(n => n.country)).size
  }), [notes]);

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
    if (window.confirm('Excluir permanentemente?')) {
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
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && window.confirm('Substituir base atual?')) setNotes(json);
      } catch (err) { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 print:bg-white print:pb-0">
      <header className="sticky top-0 z-40 bg-[#0f172a] text-white shadow-2xl px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-inner">
              <i className="fa-solid fa-vault text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">NUMIS-ARCHIVE</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">PRO Database</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"></i>
              <input 
                type="text" 
                placeholder="Buscar cédula..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"><i className="fa-solid fa-download"></i></button>
            <button onClick={() => fileImportRef.current?.click()} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"><i className="fa-solid fa-upload"></i></button>
            <input type="file" ref={fileImportRef} className="hidden" accept=".json" onChange={handleImport} />
            <button onClick={() => setIsAdding(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <i className="fa-solid fa-plus-circle"></i> Novo
            </button>
          </div>
        </div>
      </header>

      {!isAdding && !editingId && (
        <div className="max-w-7xl mx-auto px-6 mt-6 flex justify-between items-end print:hidden">
          <div className="flex gap-4">
            <div className="bg-white p-3 pr-8 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Acervo</p>
              <p className="text-xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-white p-3 pr-8 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Países</p>
              <p className="text-xl font-black text-slate-800">{stats.countries}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 items-end">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Ordenar por</label>
             <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none"
             >
               <option value="date">Data de Inclusão</option>
               <option value="country">País (A-Z)</option>
               <option value="val">Denominação (Maior)</option>
             </select>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-6 print:p-0">
        {isAdding || editingId ? (
          <BanknoteForm initialData={editingId ? notes.find(n => n.id === editingId) : undefined} onSubmit={handleAddOrEdit} onCancel={() => { setIsAdding(false); setEditingId(null); }} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredNotes.map(note => (
              <div key={note.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col cursor-pointer" onClick={() => setViewGalleryNoteId(note.id)}>
                <div className="aspect-[1.5/1] bg-slate-100 relative overflow-hidden">
                  {note.images.front ? <img src={note.images.front} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex items-center justify-center h-full text-slate-200"><i className="fa-solid fa-panorama text-3xl"></i></div>}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(note.id); }} className="w-7 h-7 bg-white text-indigo-600 rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="w-7 h-7 bg-white text-rose-600 rounded-lg flex items-center justify-center shadow-md hover:bg-rose-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-[10px]"></i></button>
                  </div>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded text-[8px] text-white font-black z-10">{note.pickId || 'S/ID'}</div>
                  {note.grade && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[8px] font-black z-10 shadow-sm">{note.grade}</div>}
                </div>
                <div className="p-3">
                  <div className="text-[8px] text-indigo-500 font-black uppercase mb-0.5 truncate">{note.country}</div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight mb-0.5 truncate">{note.denomination} {note.currency}</h3>
                  <p className="text-[9px] text-slate-400 font-medium truncate">{note.issueDate} • {note.material}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewGalleryNoteId && <ImageGalleryModal note={notes.find(n => n.id === viewGalleryNoteId)!} onClose={() => setViewGalleryNoteId(null)} onUpdateNote={handleUpdateNote} />}
      
      <style>{`
        @media print {
          .print-sheet { display: block !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
