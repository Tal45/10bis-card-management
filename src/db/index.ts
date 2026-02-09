import Dexie, { type Table } from 'dexie';
import type { Card, CardEvent } from './schema';

export class AppDatabase extends Dexie {
  cards!: Table<Card>;
  events!: Table<CardEvent>;

  constructor() {
    super('GiftCardWalletDB');
    this.version(1).stores({
      cards: 'id, storeId, expirationDate, archivedAt, lastUsedAt, nickname, amountMinor',
      events: 'id, cardId, type, createdAt'
    });
  }
}

export const db = new AppDatabase();
