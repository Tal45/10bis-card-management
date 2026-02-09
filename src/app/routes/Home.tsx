import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Settings as SettingsIcon, Archive } from 'lucide-react';
import { cardService } from '../../features/cards/cardService';
import type { Card } from '../../db/schema';
import { formatDistanceToNow, isPast } from 'date-fns';
import { getStoreById } from '../../utils/stores';

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [showArchived]);

  const loadCards = async () => {
    setLoading(true);
    const all = await (showArchived ? cardService.getAllCards(true) : cardService.getActiveCards());
    setCards(all);
    setLoading(false);
  };

  const filteredCards = cards.filter(c => {
    const store = getStoreById(c.storeId);
    return store.name.toLowerCase().includes(search.toLowerCase()) || 
           c.nickname.toLowerCase().includes(search.toLowerCase()) || 
           c.number.includes(search);
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between py-4 border-b border-carbon-gray-80 mb-6">
        <h1 className="text-xl font-medium tracking-tight">My Cards</h1>
        <div className="flex gap-1">
          <Link to="/settings" className="p-3 text-carbon-text-secondary hover:bg-carbon-gray-90 transition-colors">
            <SettingsIcon size={20} />
          </Link>
          <Link to="/add" className="p-3 bg-carbon-blue-60 text-white hover:bg-carbon-blue-70 transition-colors">
            <Plus size={20} />
          </Link>
        </div>
      </header>

      <div className="relative">
        <input
          type="text"
          placeholder="Search by store, name or number..."
          className="carbon-input pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-carbon-text-helper" size={18} />
      </div>

      <div className="flex items-center justify-between px-1 py-2">
        <button 
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 text-xs font-medium transition-colors ${showArchived ? 'text-carbon-blue-60' : 'text-carbon-text-secondary hover:text-carbon-text-primary'}`}
        >
          <Archive size={14} />
          {showArchived ? 'Showing All' : 'Show Archived'}
        </button>
      </div>

      <div className="grid gap-[1px] bg-carbon-gray-80 border border-carbon-gray-80">
        {loading ? (
          <div className="text-center py-12 text-carbon-text-helper bg-carbon-gray-100">Loading cards...</div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-16 bg-carbon-gray-90">
            <p className="text-carbon-text-secondary mb-4 text-sm">No cards found</p>
            <Link to="/add" className="text-carbon-blue-60 text-sm font-semibold hover:underline">Add your first card</Link>
          </div>
        ) : (
          filteredCards.map(card => (
            <CardItem key={card.id} card={card} onUpdate={loadCards} />
          ))
        )}
      </div>
    </div>
  );
}

function CardItem({ card, onUpdate }: { card: Card, onUpdate: () => void }) {
  const store = getStoreById(card.storeId);
  const isExpired = isPast(new Date(card.expirationDate));
  const amount = (card.amountMinor / 100).toFixed(2);

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (card.archivedAt) {
      await cardService.restoreCard(card.id);
    } else {
      await cardService.archiveCard(card.id);
    }
    onUpdate();
  };

  return (
    <Link to={`/card/${card.id}`} className={`flex items-center gap-4 bg-carbon-gray-90 p-4 hover:bg-carbon-gray-80 transition-colors ${card.archivedAt ? 'opacity-50' : ''}`}>
      <div className="w-12 h-12 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-carbon-gray-80">
        {store.logo ? (
          <img src={`/stores/${store.logo}`} alt={store.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-carbon-gray-100 font-bold text-lg">{store.name[0]}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-carbon-text-primary truncate">{card.nickname || store.name}</h3>
          <span className="text-lg font-bold text-carbon-text-primary ml-2">
            {amount}<span className="text-xs ml-0.5 font-normal"> {card.currency === 'ILS' ? '₪' : card.currency}</span>
          </span>
        </div>
        
        <div className="flex justify-between items-end mt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-mono text-carbon-text-helper tracking-wider">
              {card.number.slice(-4).padStart(card.number.length, '*')}
            </p>
            <p className={`text-[10px] ${isExpired ? 'text-red-400' : 'text-carbon-text-helper'}`}>
              {isExpired ? 'Expired' : `Expires ${formatDistanceToNow(new Date(card.expirationDate), { addSuffix: true })}`}
            </p>
          </div>
          <button 
            onClick={handleArchive}
            className="p-1 text-carbon-text-helper hover:text-carbon-text-primary transition-colors"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>
      
      {card.isEmpty && (
        <div className="absolute top-0 right-0 bg-carbon-gray-70 text-[8px] px-1 text-white uppercase font-bold">
          EMPTY
        </div>
      )}
    </Link>
  );
}
