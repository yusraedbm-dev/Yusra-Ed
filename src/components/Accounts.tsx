import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  UserPlus, 
  Search, 
  Star, 
  Phone, 
  Mail,
  Award,
  Trash2,
  X,
  Wallet,
  ArrowDownCircle,
  Plus,
  AlertTriangle,
  GripHorizontal
} from 'lucide-react';
import { db, type Customer } from '../db';
import { toast } from 'sonner';
import { motion, AnimatePresence, useDragControls } from 'motion/react';

export default function Accounts() {
  const dragControls = useDragControls();
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', email: '', phone: '' });
  
  // Modals state
  const [editingPointsId, setEditingPointsId] = useState<number | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState<string>('');
  
  const [payingCustomerCreditId, setPayingCustomerCreditId] = useState<number | null>(null);
  const [customerCreditPayment, setCustomerCreditPayment] = useState<string>('');
  
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currency = settings?.currency || 'PHP';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const totalReceivable = customers.reduce((acc, c) => acc + (c.creditBalance || 0), 0);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.customers.add({
        ...newAccount,
        loyaltyPoints: 0,
        creditBalance: 0,
        createdAt: Date.now()
      });
      toast.success('Customer registered successfully');
      setIsAdding(false);
      setNewAccount({ name: '', email: '', phone: '' });
    } catch (error) {
      toast.error('Failed to add account');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingId) return;
    try {
      await db.customers.delete(deletingId);
      toast.success('Customer deleted');
      setDeletingId(null);
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleAdjustPoints = async (id: number, currentPoints: number) => {
    const adjustment = parseInt(pointsAdjustment);
    if (isNaN(adjustment)) {
      toast.error('Please enter a valid number');
      return;
    }
    try {
      await db.customers.update(id, {
        loyaltyPoints: Math.max(0, currentPoints + adjustment)
      });
      setEditingPointsId(null);
      setPointsAdjustment('');
      toast.success('Points updated');
    } catch (error) {
      toast.error('Failed to update points');
    }
  };

  const handlePayCustomerCredit = async (id: number, currentBalance: number) => {
    const payment = parseFloat(customerCreditPayment);
    if (isNaN(payment) || payment <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    try {
      await db.customers.update(id, {
        creditBalance: Math.max(0, currentBalance - payment)
      });
      setPayingCustomerCreditId(null);
      setCustomerCreditPayment('');
      toast.success('Credit payment recorded');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Accounts Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 lg:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-2">Total Receivable (Customers)</div>
            <div className="text-3xl lg:text-4xl font-black text-green-600 dark:text-green-400">
              {formatCurrency(totalReceivable)}
            </div>
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 text-[10px] lg:text-xs font-medium mt-4">Money owed to you</div>
        </div>
        <div className="bg-zinc-900 dark:bg-zinc-100 p-6 lg:p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white dark:text-zinc-900">
          <div>
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-2">Total Members</div>
            <div className="text-3xl lg:text-4xl font-black">
              {customers.length}
            </div>
          </div>
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] lg:text-xs font-medium mt-4">Registered accounts</div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts..." 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary-light"
        >
          <UserPlus size={20} />
          Add Account
        </button>
      </div>

      {/* Unified List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredCustomers.map((customer) => (
            <div key={`cust-mob-${customer.id}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{customer.phone || 'No phone'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black ${customer.creditBalance > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {customer.creditBalance > 0 ? formatCurrency(customer.creditBalance) : 'No Debt'}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Balance</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (customer.loyaltyPoints / 500) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{customer.loyaltyPoints} pts</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setPayingCustomerCreditId(customer.id || null)}
                    className={`p-2 rounded-lg transition-colors ${customer.creditBalance > 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-zinc-300'}`}
                    disabled={!(customer.creditBalance > 0)}
                  >
                    <ArrowDownCircle size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingPointsId(customer.id || null)}
                    className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400"
                  >
                    <Award size={16} />
                  </button>
                  <button 
                    onClick={() => setDeletingId(customer.id || null)}
                    className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Account Name</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Loyalty / Status</th>
                <th className="px-6 py-4 font-semibold">Balance</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredCustomers.map((customer) => (
                <tr key={`cust-${customer.id}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{customer.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (customer.loyaltyPoints / 500) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{customer.loyaltyPoints} pts</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-black ${customer.creditBalance > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                      {customer.creditBalance > 0 ? `Receivable: ${formatCurrency(customer.creditBalance)}` : 'No Debt'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setPayingCustomerCreditId(customer.id || null)}
                        className={`p-2 rounded-lg transition-colors ${customer.creditBalance > 0 ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-zinc-300 cursor-not-allowed'}`}
                        disabled={!(customer.creditBalance > 0)}
                        title="Record Payment from Customer"
                      >
                        <ArrowDownCircle size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingPointsId(customer.id || null)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-primary transition-colors"
                        title="Adjust Points"
                      >
                        <Award size={18} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(customer.id || null)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-zinc-400 italic text-sm">No accounts found</div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Account Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              drag
              dragMomentum={false}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div 
                className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center cursor-move bg-zinc-50/50 dark:bg-zinc-800/50 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center gap-2">
                  <GripHorizontal size={18} className="text-zinc-400" />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Add New Account</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Name / Company</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                    value={newAccount.name}
                    onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Phone</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={newAccount.phone}
                      onChange={e => setNewAccount({...newAccount, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={newAccount.email}
                      onChange={e => setNewAccount({...newAccount, email: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:brightness-110 shadow-lg shadow-primary-light transition-all mt-4"
                >
                  Register Account
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Delete Account?</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">This action cannot be undone. All data for this account will be removed.</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDeleteCustomer}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Adjust Points Modal */}
        {editingPointsId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-xs border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider">Adjust Loyalty Points</h4>
              <input 
                type="number" 
                placeholder="+/- Points"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold mb-4 outline-none focus:ring-2 focus:ring-primary"
                value={pointsAdjustment}
                onChange={(e) => setPointsAdjustment(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => handleAdjustPoints(editingPointsId, customers.find(c => c.id === editingPointsId)?.loyaltyPoints || 0)} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">Apply</button>
                <button onClick={() => setEditingPointsId(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-xl">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Pay Customer Credit Modal */}
        {payingCustomerCreditId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-xs border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <h4 className="text-sm font-bold mb-2 uppercase tracking-wider">Record Customer Payment</h4>
              <p className="text-[10px] text-zinc-500 mb-4">Debt: {formatCurrency(customers.find(c => c.id === payingCustomerCreditId)?.creditBalance || 0)}</p>
              <input 
                type="number" 
                placeholder="Payment Amount"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold mb-4 outline-none focus:ring-2 focus:ring-green-500"
                value={customerCreditPayment}
                onChange={(e) => setCustomerCreditPayment(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => handlePayCustomerCredit(payingCustomerCreditId, customers.find(c => c.id === payingCustomerCreditId)?.creditBalance || 0)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl">Record</button>
                <button onClick={() => setPayingCustomerCreditId(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-xl">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
