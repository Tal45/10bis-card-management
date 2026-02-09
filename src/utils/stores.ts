export type StoreCategory = 'Supermarket' | 'Restaurant' | 'Cafe' | 'Other';

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  logo: string;
  color: string;
}

export const STORES: Store[] = [
  { id: 'shufersal', name: 'שופרסל', category: 'Supermarket', logo: 'שופרסל.jpg', color: '#ee1c25' },
  { id: 'victory', name: 'ויקטורי', category: 'Supermarket', logo: 'ויקטורי.jpg', color: '#2d3092' },
  { id: 'be-pharm', name: 'בי פארם', category: 'Supermarket', logo: 'בי פארם.png', color: '#000000' },
  { id: 'ramy-levy', name: 'רמי לוי בשכונה', category: 'Supermarket', logo: 'רמי לוי בשכונה.jpg', color: '#ed1c24' },
  { id: 'carrefour', name: 'קרפור', category: 'Supermarket', logo: 'קרפור.gif', color: '#0055a4' },
  { id: 'king-store', name: 'קינג סטור', category: 'Supermarket', logo: 'קינג סטור.jpg', color: '#000000' },
  { id: 'machsanei-hashuk', name: 'מחסני השוק', category: 'Supermarket', logo: 'מחסני השוק.jpg', color: '#ed1c24' },
  { id: 'hahishuk', name: 'החישוק', category: 'Supermarket', logo: 'החישוק.png', color: '#000000' },
  { id: 'shefa-birkat-hashem', name: 'שפע ברכת השם', category: 'Supermarket', logo: 'שפע ברכת השם.png', color: '#000000' },
  { id: 'other', name: 'Other', category: 'Other', logo: '', color: '#525252' }
];

export const getStoreById = (id: string) => STORES.find(s => s.id === id) || STORES.find(s => s.id === 'other')!;
