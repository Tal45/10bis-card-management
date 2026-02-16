import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Trash2, Archive, RotateCcw, Edit2, Check, ExternalLink } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { cardService } from '../../features/cards/cardService';
import type { Card } from '../../db/schema';
import { getStoreById } from '../../utils/stores';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (id) {
      loadCard(id);
    }
  }, [id]);

  useEffect(() => {
    if (card && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, card.number, {
          format: "CODE128",
          width: 2.5,
          height: 100,
          displayValue: false,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [card, showCode]);

  const loadCard = async (cardId: string) => {
    const data = await cardService.getCardById(cardId);
    if (data) {
      setCard(data);
      setNewAmount((data.amountMinor / 100).toString());
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (card) {
      const cleanNumber = card.number.replace(/\s/g, '');
      
      // Try the modern ClipboardItem API first (allows explicit MIME type)
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard && window.isSecureContext) {
        const type = "text/plain";
        const blob = new Blob([cleanNumber], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        
        navigator.clipboard.write(data).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          copyFallback(cleanNumber);
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cleanNumber).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          copyFallback(cleanNumber);
        });
      } else {
        copyFallback(cleanNumber);
      }
    }
  };

  const copyFallback = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Ensure it's not visible and doesn't scroll the page
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleUpdateAmount = async () => {
    if (card) {
      const amount = parseFloat(newAmount);
      if (!isNaN(amount) && amount >= 0) {
        await cardService.updateAmount(card.id, Math.round(amount * 100));
        await loadCard(card.id);
        setIsEditingAmount(false);
      }
    }
  };

  const handleArchive = async () => {
    if (card) {
      if (card.archivedAt) {
        await cardService.restoreCard(card.id);
      } else {
        await cardService.archiveCard(card.id);
      }
      await loadCard(card.id);
    }
  };

  const handleDelete = async () => {
    if (card && confirm('Are you sure you want to permanently delete this card?')) {
      await cardService.deleteCard(card.id);
      navigate('/');
    }
  };

  if (loading) return <div className="text-center py-20 text-carbon-text-helper">Loading...</div>;
  if (!card) return null;

  const store = getStoreById(card.storeId);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between py-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-carbon-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-1">
          <button onClick={handleArchive} className="p-3 text-carbon-text-secondary hover:bg-carbon-gray-90 transition-colors">
            {card.archivedAt ? <RotateCcw size={20} /> : <Archive size={20} />}
          </button>
          <button onClick={handleDelete} className="p-3 text-red-400 hover:bg-carbon-gray-90 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="bg-carbon-gray-90 border border-carbon-gray-80 p-8 text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white p-2 border border-carbon-gray-80 flex items-center justify-center overflow-hidden shadow-lg">
            {store.logo ? (
              <img src={`/stores/${store.logo}`} alt={store.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-carbon-gray-100 font-bold text-2xl">{store.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{card.nickname || store.name}</h1>
            <p className="text-xs text-carbon-text-helper mt-1 tracking-wider uppercase">Expires: {card.expirationDate}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 border-y border-carbon-gray-80 py-6">
          {isEditingAmount ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-28 text-3xl font-bold bg-carbon-gray-100 border-b border-carbon-blue-60 text-center focus:outline-none"
                autoFocus
                inputMode="decimal"
              />
              <button onClick={handleUpdateAmount} className="p-2 bg-carbon-blue-60 text-white rounded-none">
                <Check size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingAmount(true)}>
              <span className="text-4xl font-bold">
                {(card.amountMinor / 100).toFixed(2)}<span className="text-lg ml-1 font-medium">{card.currency === 'ILS' ? '₪' : card.currency}</span>
              </span>
              <Edit2 size={16} className="text-carbon-text-helper opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <a 
            href="https://multipass.co.il/GetBalance" 
            target="_blank" 
            rel="noopener noreferrer"
            className="carbon-button-primary w-full max-w-xs text-sm py-2"
          >
            <span>Check Balance</span>
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="space-y-4">
          <div className="bg-carbon-gray-100 p-6 border border-carbon-gray-80 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-1 bg-carbon-gray-80 text-[8px] text-carbon-text-helper uppercase font-bold tracking-widest">
                {copied ? <span className="text-carbon-blue-60">Copied!</span> : 'Card Number'}
             </div>
            <div className={`font-mono text-xl tracking-[0.25em] font-bold mt-2 ${!showCode && 'blur-md select-none'}`}>
              {card.number}
            </div>
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-carbon-text-helper hover:text-carbon-blue-60 transition-colors"
            >
              {copied ? <Check size={20} className="text-carbon-blue-60" /> : <Copy size={20} />}
            </button>
          </div>
          <button 
            onClick={() => setShowCode(!showCode)}
            className="text-[10px] font-bold text-carbon-text-helper hover:text-carbon-text-primary uppercase tracking-[0.2em] transition-colors"
          >
            {showCode ? 'Tap to hide code' : 'Tap to reveal code'}
          </button>
        </div>

        <div className="pt-4 flex flex-col items-center gap-10">
          <div className="bg-white p-4 inline-block shadow-2xl border-4 border-white">
             <svg ref={barcodeRef} className="max-w-full"></svg>
          </div>
          
          <div className="bg-white p-6 inline-block shadow-2xl border-[12px] border-white">
            <QRCodeSVG value={card.number} size={180} level="H" />
          </div>
        </div>
      </div>

      {card.notes && (
        <div className="bg-carbon-gray-90 border border-carbon-gray-80 p-6">
          <h3 className="text-xs font-bold text-carbon-text-helper uppercase tracking-widest mb-3 border-b border-carbon-gray-80 pb-2">Notes</h3>
          <p className="text-sm text-carbon-text-secondary whitespace-pre-wrap leading-relaxed">{card.notes}</p>
        </div>
      )}
    </div>
  );
}
