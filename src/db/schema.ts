export interface Card {
  id: string;
  storeId: string;
  number: string;
  amountMinor: number;
  expirationDate: string; // ISO YYYY-MM-DD
  nickname: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  lastUsedAt: string | null;
  isEmpty: boolean;
  notes?: string;
}

export interface CardEvent {
  id: string;
  cardId: string;
  type: 'CREATE' | 'UPDATE_AMOUNT' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'MARK_EMPTY';
  deltaAmountMinor?: number;
  createdAt: string;
}
