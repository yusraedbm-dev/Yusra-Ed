import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { db } from '../db';
import { motion, AnimatePresence } from 'motion/react';

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'annually' | 'all';

export default function Transactions() {
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  const currency = settings?.currency || 'PHP';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id?.toString().includes(searchTerm) || 
                         sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTime = true;
    if (timeFilter === 'daily') matchesTime = sale.timestamp >= startOfDay;
    else if (timeFilter === 'weekly') matchesTime = sale.timestamp >= startOfWeek;
    else if (timeFilter === 'monthly') matchesTime = sale.timestamp >= startOfMonth;
    else if (timeFilter === 'annually') matchesTime = sale.timestamp >= startOfYear;

    return matchesSearch && matchesTime;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100">Transaction Records</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">View and manage your sales history.</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-6">
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Period Revenue</div>
            <div className="text-xl font-black text-primary">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Count</div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">{filteredSales.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or method..." 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1">
          {(['daily', 'weekly', 'monthly', 'annually', 'all'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                timeFilter === filter 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredSales.map((sale) => {
            const customer = customers.find(c => c.id === sale.customerId);
            return (
              <div 
                key={`trx-mob-${sale.id}`} 
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => setSelectedSaleId(sale.id || null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-mono text-zinc-400">#TRX-{sale.id}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(sale.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {customer?.name || 'Walk-in Customer'}
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-tighter ${
                      sale.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(sale.total)}</div>
                    <div className="text-[10px] text-primary font-bold">View Items</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Customer/Creditor</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Processed By</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredSales.map((sale) => {
                const customer = customers.find(c => c.id === sale.customerId);
                return (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-400">#TRX-{sale.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        <Clock size={14} className="text-zinc-400" />
                        {new Date(sale.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {customer?.name || 'Walk-in Customer'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                        sale.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {sale.processedBy || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(sale.total)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedSaleId(sale.id || null)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="p-12 text-center text-zinc-400 italic text-sm">No transactions found for this period</div>
        )}
      </div>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSaleId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Transaction Details</h3>
                <button onClick={() => setSelectedSaleId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  {sales.find(s => s.id === selectedSaleId)?.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-zinc-400">
                          {item.quantity}x
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-500">Total Amount</span>
                    <span className="text-xl font-black text-primary">
                      {formatCurrency(sales.find(s => s.id === selectedSaleId)?.total || 0)}
                    </span>
                  </div>
                </div>
                {sales.find(s => s.id === selectedSaleId)?.processedBy && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Processed By</span>
                    <span>{sales.find(s => s.id === selectedSaleId)?.processedBy}</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => setSelectedSaleId(null)}
                  className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
