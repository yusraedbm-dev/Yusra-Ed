import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Wallet,
  Building2
} from 'lucide-react';
import { db } from '../db';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Brush
} from 'recharts';

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {entry.name}: {typeof entry.value === 'number' ? new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(entry.value) : entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [timeRange, setTimeRange] = useState('7d');

  const currency = settings?.currency || 'PHP';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Calculate stats
  const totalRevenue = sales.reduce((acc, t) => acc + t.total, 0);
  const totalProfit = sales.reduce((acc, t) => {
    const transactionProfit = t.items.reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      return itemAcc + (item.price - (product?.cost || 0)) * item.quantity;
    }, 0);
    return acc + transactionProfit;
  }, 0);

  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.creditBalance || 0), 0);

  // Chart data preparation
  const salesByDay = sales.reduce((acc: any[], t) => {
    const date = new Date(t.timestamp).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.sales += t.total;
    } else {
      acc.push({ date, sales: t.total });
    }
    return acc;
  }, []).slice(-7);

  const categoryData = products.reduce((acc: any[], p) => {
    const existing = acc.find(item => item.name === p.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: p.category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['var(--primary-color)', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleDownloadReport = () => {
    const headers = ['Date', 'Total Sales'];
    const csvContent = [
      headers.join(','),
      ...salesByDay.map(row => `${row.date},${row.sales}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100">Analytics & Reports</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Detailed insights into your business performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
            {['24h', '7d', '30d', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={handleDownloadReport}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(totalRevenue)}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">Profit</span>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Total Profit</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(totalProfit)}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">Receivable</span>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Customer Debt</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(totalCustomerDebt)}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <LineChartIcon size={18} className="text-primary" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Sales Trend</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}}
                  tickFormatter={(value) => `₱${value}`}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Sales"
                  stroke="var(--primary-color)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Brush 
                  dataKey="date" 
                  height={30} 
                  stroke="var(--primary-color)" 
                  fill="var(--primary-color-light)"
                  travellerWidth={10}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <PieChartIcon size={18} className="text-primary" />
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Category Distribution</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {categoryData.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
