import { db } from '../../db';
import type { Card } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

export const cardService = {
  async getAllCards(showArchived = false) {
    if (showArchived) {
      return db.cards.toArray();
    }
    const all = await db.cards.toArray();
    return all.filter(c => !c.archivedAt);
  },

  async getActiveCards() {
    const all = await db.cards.toArray();
    return all.filter(c => !c.archivedAt).sort((a, b) => {
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
    });
  },

  async getCardById(id: string) {
    return db.cards.get(id);
  },

  async createCard(cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'lastUsedAt' | 'isEmpty'>) {
    const now = new Date().toISOString();
    const id = uuidv4();
    const card: Card = {
      ...cardData,
      id,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      lastUsedAt: null,
      isEmpty: cardData.amountMinor === 0,
    };

    await db.transaction('rw', db.cards, db.events, async () => {
      await db.cards.add(card);
      await db.events.add({
        id: uuidv4(),
        cardId: id,
        type: 'CREATE',
        deltaAmountMinor: card.amountMinor,
        createdAt: now,
      });
    });

    return card;
  },

  async updateAmount(id: string, newAmountMinor: number) {
    const now = new Date().toISOString();
    const card = await db.cards.get(id);
    if (!card) throw new Error('Card not found');

    const delta = newAmountMinor - card.amountMinor;

    await db.transaction('rw', db.cards, db.events, async () => {
      await db.cards.update(id, {
        amountMinor: newAmountMinor,
        isEmpty: newAmountMinor === 0,
        updatedAt: now,
      });
      await db.events.add({
        id: uuidv4(),
        cardId: id,
        type: 'UPDATE_AMOUNT',
        deltaAmountMinor: delta,
        createdAt: now,
      });
    });
  },

  async archiveCard(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.cards, db.events, async () => {
      await db.cards.update(id, { archivedAt: now, updatedAt: now });
      await db.events.add({
        id: uuidv4(),
        cardId: id,
        type: 'ARCHIVE',
        createdAt: now,
      });
    });
  },

  async restoreCard(id: string) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.cards, db.events, async () => {
      await db.cards.update(id, { archivedAt: null, updatedAt: now });
      await db.events.add({
        id: uuidv4(),
        cardId: id,
        type: 'RESTORE',
        createdAt: now,
      });
    });
  },

  async deleteCard(id: string) {
    await db.transaction('rw', db.cards, db.events, async () => {
      await db.cards.delete(id);
      await db.events.where('cardId').equals(id).delete();
    });
  },

  async markEmpty(id: string) {
    await this.updateAmount(id, 0);
  }
};
