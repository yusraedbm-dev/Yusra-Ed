import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Wallet,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { db } from '../db';

export default function Dashboard({ onViewAllTransactions }: { onViewAllTransactions?: () => void }) {
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const currency = settings?.currency || 'PHP';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = sales.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.creditBalance || 0), 0);

  const chartData = sales.slice(-7).map(s => ({
    name: new Date(s.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
    total: s.total
  }));

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, trend: '+12.5%', up: true },
    { label: 'Customer Debt', value: formatCurrency(totalCustomerDebt), icon: Wallet, trend: 'Receivable', up: true },
    { label: 'Total Sales', value: totalSales, icon: ShoppingCart, trend: 'Orders', up: true },
    { label: 'Low Stock', value: lowStockItems, icon: Package, trend: '-3', up: false },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-zinc-900 p-5 lg:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 lg:p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-600 dark:text-zinc-400">
                <stat.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-green-600' : 'text-primary'}`}>
                {stat.trend}
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100">{stat.value}</div>
            <div className="text-xs lg:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold mb-6 text-zinc-900 dark:text-zinc-100">Sales Overview</h3>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    backgroundColor: '#18181b',
                    color: '#f4f4f5'
                  }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base lg:text-lg font-bold mb-6 text-zinc-900 dark:text-zinc-100">Inventory Distribution</h3>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#27272a'}}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    backgroundColor: '#18181b',
                    color: '#f4f4f5'
                  }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Bar dataKey="total" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-bold text-zinc-900 dark:text-zinc-100">Recent Transactions</h3>
          <button 
            onClick={onViewAllTransactions}
            className="text-xs font-bold text-primary hover:brightness-110 uppercase tracking-wider"
          >
            View All
          </button>
        </div>
        
        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {sales.slice(-5).reverse().map((sale) => (
            <div key={sale.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">#TRX-{sale.id}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{new Date(sale.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(sale.total)}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">{sale.paymentMethod}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sales.slice(-5).reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">#TRX-{sale.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">Walk-in Customer</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 capitalize">{sale.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sales.length === 0 && (
          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 italic text-sm">No transactions yet</div>
        )}
      </div>
    </div>
  );
}
