import { db } from './db';

export const SyncService = {
  async sync() {
    if (!navigator.onLine) return;

    try {
      const pendingSales = await db.sales.where('syncStatus').equals('pending').toArray();
      
      if (pendingSales.length === 0) return;

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { sales: pendingSales },
          lastSync: localStorage.getItem('lastSync')
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Mark as synced
        await db.sales.where('id').anyOf(pendingSales.map(s => s.id!)).modify({ syncStatus: 'synced' });
        localStorage.setItem('lastSync', result.serverTime);
        console.log('Sync successful');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  startAutoSync(intervalMs = 30000) {
    setInterval(() => this.sync(), intervalMs);
    window.addEventListener('online', () => this.sync());
  }
};
