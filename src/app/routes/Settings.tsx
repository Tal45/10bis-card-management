import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Upload, Trash2, ShieldCheck, Info } from 'lucide-react';
import { db } from '../../db';

export default function Settings() {
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      const cards = await db.cards.toArray();
      const events = await db.events.toArray();
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        cards,
        events
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gift-cards-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will merge the imported cards with your existing cards. Continue?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error('Invalid backup file');
        }

        await db.transaction('rw', db.cards, db.events, async () => {
          for (const card of data.cards) {
            const exists = await db.cards.get(card.id);
            if (!exists) {
              await db.cards.add(card);
            }
          }
          if (data.events && Array.isArray(data.events)) {
            for (const ev of data.events) {
              const exists = await db.events.get(ev.id);
              if (!exists) {
                await db.events.add(ev);
              }
            }
          }
        });

        alert('Import successful!');
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('Import failed: Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (confirm('DANGER: This will permanently delete ALL cards and history. Are you absolutely sure?')) {
      await db.cards.clear();
      await db.events.clear();
      alert('All data cleared');
      navigate('/');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-carbon-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Settings</h1>
      </header>

      <div className="space-y-4">
        <section className="bg-carbon-gray-90 border border-carbon-gray-80 overflow-hidden">
          <div className="px-6 py-4 border-b border-carbon-gray-80 flex items-center gap-2">
            <ShieldCheck className="text-carbon-blue-60" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Data Management</h2>
          </div>
          
          <div className="divide-y divide-carbon-gray-80">
            <button 
              onClick={handleExport}
              className="w-full flex items-center gap-4 p-5 hover:bg-carbon-gray-80 transition-colors text-left"
            >
              <Download size={20} className="text-carbon-text-secondary" />
              <div className="flex-1">
                <div className="font-medium">Export Backup</div>
                <div className="text-[10px] text-carbon-text-helper uppercase tracking-wider">Download all cards as a JSON file</div>
              </div>
            </button>

            <label className="w-full flex items-center gap-4 p-5 hover:bg-carbon-gray-80 transition-colors cursor-pointer text-left">
              <Upload size={20} className="text-carbon-text-secondary" />
              <div className="flex-1">
                <div className="font-medium">Import Backup</div>
                <div className="text-[10px] text-carbon-text-helper uppercase tracking-wider">Restore cards from a previous backup</div>
              </div>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button 
              onClick={handleClearData}
              className="w-full flex items-center gap-4 p-5 hover:bg-red-900/20 transition-colors text-left group"
            >
              <Trash2 size={20} className="text-red-400" />
              <div className="flex-1">
                <div className="font-medium text-red-400">Clear All Data</div>
                <div className="text-[10px] text-carbon-text-helper uppercase tracking-wider">Reset the app to its initial state</div>
              </div>
            </button>
          </div>
        </section>

        <section className="bg-carbon-gray-90 border border-carbon-gray-80 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={18} className="text-carbon-blue-60" />
            <h2 className="text-sm font-bold uppercase tracking-widest">About</h2>
          </div>
          <p className="text-sm text-carbon-text-secondary leading-relaxed">
            Gift Card Wallet is a privacy-first, offline PWA. Your data never leaves your device.
          </p>
          <div className="text-[10px] text-carbon-text-helper uppercase tracking-[0.3em] font-bold pt-4 border-t border-carbon-gray-80">
            Version 1.0.0
          </div>
        </section>
      </div>
    </div>
  );
}
