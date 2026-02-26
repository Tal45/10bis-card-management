import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronLeft, Save } from 'lucide-react';
import { cardService } from '../../features/cards/cardService';
import { STORES } from '../../utils/stores';

const schema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  nickname: z.string().optional(),
  number: z.string().min(4, 'Card number must be at least 4 characters'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  currency: z.string(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddCard() {
  const navigate = useNavigate();
  
  // Calculate default expiration date (5 years from now)
  const defaultExpDate = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date.toISOString().split('T')[0];
  })();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: '',
      nickname: '',
      number: '',
      currency: 'ILS',
      amount: 0,
      expirationDate: defaultExpDate,
      notes: '',
    }
  });

  const selectedStoreId = watch('storeId');

  const onSubmit = async (data: FormData) => {
    try {
      await cardService.createCard({
        ...data,
        number: data.number.trim(),
        nickname: data.nickname || '',
        amountMinor: Math.round(data.amount * 100),
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error saving card');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-carbon-text-secondary">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-medium">Add Card</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <label className="carbon-label">Select Store</label>
          <div className="grid grid-cols-3 gap-2">
            {STORES.map(store => (
              <button
                key={store.id}
                type="button"
                onClick={() => setValue('storeId', store.id)}
                className={`flex flex-col items-center gap-2 p-3 border transition-all ${
                  selectedStoreId === store.id 
                  ? 'bg-carbon-gray-80 border-carbon-blue-60 ring-1 ring-carbon-blue-60' 
                  : 'bg-carbon-gray-90 border-carbon-gray-80'
                }`}
              >
                <div className="w-10 h-10 bg-white flex items-center justify-center overflow-hidden border border-carbon-gray-80">
                  {store.logo ? (
                    <img src={`/stores/${store.logo}`} alt={store.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-carbon-gray-100 font-bold text-xs">{store.name}</span>
                  )}
                </div>
                <span className="text-[10px] text-center font-medium truncate w-full">{store.name}</span>
              </button>
            ))}
          </div>
          {errors.storeId && <p className="text-red-400 text-xs mt-1">{errors.storeId.message}</p>}
        </section>

        <div className="space-y-6">
          <div>
            <label className="carbon-label">Nickname (Optional)</label>
            <input
              {...register('nickname')}
              placeholder="e.g. My Gift Card"
              className="carbon-input"
            />
          </div>

          <div>
            <label className="carbon-label">Card Number</label>
            <input
              {...register('number')}
              placeholder="Enter card digits"
              className="carbon-input font-mono tracking-widest"
              inputMode="numeric"
            />
            {errors.number && <p className="text-red-400 text-xs mt-1">{errors.number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="carbon-label">Amount</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                onFocus={(e) => e.target.select()}
                className="carbon-input"
                inputMode="decimal"
              />
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="carbon-label">Currency</label>
              <select
                {...register('currency')}
                className="carbon-input appearance-none"
              >
                <option value="ILS">₪ (ILS)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="carbon-label">Expiration Date</label>
            <input
              type="date"
              {...register('expirationDate')}
              className="carbon-input"
            />
            {errors.expirationDate && <p className="text-red-400 text-xs mt-1">{errors.expirationDate.message}</p>}
          </div>

          <div>
            <label className="carbon-label">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="carbon-input resize-none"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="carbon-button-primary w-full mt-8"
        >
          <span className="font-semibold">{isSubmitting ? 'Saving...' : 'Save Card'}</span>
          <Save size={20} />
        </button>
      </form>
    </div>
  );
}
