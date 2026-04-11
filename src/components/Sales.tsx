import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote,
  UserPlus,
  Award,
  CheckCircle2,
  Wallet,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, type Product, type Sale, type Customer, type User } from '../db';
import QRScanner from './QRScanner';
import { toast } from 'sonner';

interface CartItem extends Product {
  quantity: number;
}

interface SalesProps {
  currentUser: User;
}

export default function Sales({ currentUser }: SalesProps) {
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentStep, setPaymentStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'stripe' | 'credit'>('cash');
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  const currency = settings?.currency || 'PHP';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone?.includes(customerSearch)
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    if (window.innerWidth < 1024) {
      toast.success(`Added ${product.name}`);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = usePoints ? 10 : 0; // $10 discount if points used
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const sale: Sale = {
        items: cart.map(item => ({
          productId: item.id!,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        total,
        paymentMethod,
        customerId: selectedCustomer?.id,
        timestamp: Date.now(),
        processedBy: currentUser.name
      };

      await db.sales.add(sale);

      // Update stock
      for (const item of cart) {
        await db.products.update(item.id!, {
          stock: item.stock - item.quantity,
          updatedAt: Date.now()
        });
      }

      // Update loyalty points
      if (selectedCustomer) {
        let newPoints = selectedCustomer.loyaltyPoints;
        if (usePoints) {
          newPoints -= 500;
        }
        const pointsEarned = Math.floor(total);
        
        const updateData: any = {
          loyaltyPoints: Math.max(0, newPoints + pointsEarned)
        };

        if (paymentMethod === 'credit') {
          updateData.creditBalance = (selectedCustomer.creditBalance || 0) + total;
        }

        await db.customers.update(selectedCustomer.id!, updateData);
      }

      setPaymentStep('success');
      setCart([]);
      setSelectedCustomer(null);
      setUsePoints(false);
      toast.success('Transaction completed successfully');
    } catch (error) {
      toast.error('Checkout failed');
    }
  };

  if (paymentStep === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 lg:py-20 space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 lg:w-24 lg:h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-zinc-100">Success!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Transaction #TRX-{Math.floor(Math.random() * 10000)} completed.</p>
        </div>
        <button 
          onClick={() => setPaymentStep('cart')}
          className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 shadow-lg shadow-primary-light transition-all"
        >
          New Transaction
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)]">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-4">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'products' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          Products ({filteredProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative ${
            activeTab === 'cart' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          Cart ({cart.length})
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-700">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden">
        {/* Product Selection */}
        <div className={`lg:col-span-7 flex flex-col space-y-4 lg:space-y-6 overflow-hidden ${
          activeTab === 'cart' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="flex gap-2 lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-9 pr-4 py-2.5 lg:py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all text-sm text-zinc-900 dark:text-zinc-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsScanning(true)}
              className="p-2.5 lg:p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <QrCode size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 lg:pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white dark:bg-zinc-900 p-3 lg:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-primary dark:hover:border-primary hover:shadow-md transition-all text-left group"
                >
                  <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-xl mb-2 lg:mb-3 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart size={20} className="text-zinc-300 dark:text-zinc-600 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm">{product.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-primary font-bold text-xs lg:text-sm">{formatCurrency(product.price)}</div>
                    <div className="text-[9px] lg:text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">{product.stock} in stock</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className={`lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden ${
          activeTab === 'products' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="p-4 lg:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h3 className="font-bold text-base lg:text-lg text-zinc-900 dark:text-zinc-100">Current Order</h3>
            </div>
            <button 
              onClick={() => setCart([])}
              className="text-zinc-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                  <ShoppingCart size={16} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs lg:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                  <div className="text-[10px] lg:text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(item.price)} each</div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <button 
                    onClick={() => updateQuantity(item.id!, -1)}
                    className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id!, 1)}
                    className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-xs lg:text-sm font-bold text-zinc-900 dark:text-zinc-100 w-14 lg:w-16 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 space-y-2 py-12">
                <ShoppingCart size={40} strokeWidth={1} />
                <p className="text-sm">Your cart is empty</p>
              </div>
            )}
          </div>

          <div className="p-4 lg:p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {/* Customer Selection */}
            <div className="flex items-center justify-between p-2.5 lg:p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 lg:gap-3">
                <UserPlus size={16} className="text-zinc-400 dark:text-zinc-500" />
                {selectedCustomer ? (
                  <div>
                    <div className="text-[10px] lg:text-xs font-bold text-zinc-900 dark:text-zinc-100">{selectedCustomer.name}</div>
                    <div className="text-[9px] lg:text-[10px] text-primary font-bold uppercase">{selectedCustomer.loyaltyPoints} Points</div>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Add Customer</span>
                )}
              </div>
              {selectedCustomer ? (
                <button onClick={() => setSelectedCustomer(null)} className="text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">Change</button>
              ) : (
                <button 
                  onClick={() => setIsSelectingCustomer(true)}
                  className="text-[10px] font-bold text-primary"
                >
                  Select
                </button>
              )}
            </div>

            {selectedCustomer && selectedCustomer.loyaltyPoints >= 500 && (
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-primary" />
                  <span className="text-xs font-bold text-primary">Redeem 500 pts for ₱10 discount?</span>
                </div>
                <button 
                  onClick={() => setUsePoints(!usePoints)}
                  className={`w-10 h-5 rounded-full transition-all relative ${usePoints ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${usePoints ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            )}

            <div className="space-y-1.5 lg:space-y-2">
              <div className="flex justify-between text-xs lg:text-sm text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {usePoints && (
                <div className="flex justify-between text-xs lg:text-sm text-green-600 font-bold">
                  <span>Loyalty Discount</span>
                  <span>-{formatCurrency(10)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg lg:text-xl font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 pt-2 lg:pt-4">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-1.5 p-2 lg:p-3 rounded-xl border transition-all ${
                  paymentMethod === 'cash' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Banknote size={16} />
                <span className="text-[9px] lg:text-[10px] font-bold uppercase">Cash</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center gap-1.5 p-2 lg:p-3 rounded-xl border transition-all ${
                  paymentMethod === 'card' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <CreditCard size={16} />
                <span className="text-[9px] lg:text-[10px] font-bold uppercase">Card</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('stripe')}
                className={`flex flex-col items-center gap-1.5 p-2 lg:p-3 rounded-xl border transition-all ${
                  paymentMethod === 'stripe' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-[9px] lg:text-[10px] font-bold uppercase">Stripe</span>
              </button>
              <button 
                disabled={!selectedCustomer}
                onClick={() => setPaymentMethod('credit')}
                className={`flex flex-col items-center gap-1.5 p-2 lg:p-3 rounded-xl border transition-all disabled:opacity-30 ${
                  paymentMethod === 'credit' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Wallet size={16} />
                <span className="text-[9px] lg:text-[10px] font-bold uppercase">Credit</span>
              </button>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 lg:py-4 bg-primary text-white font-bold rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary-light mt-2 lg:mt-4 text-sm"
            >
              Complete Checkout
            </button>
          </div>
        </div>
      </div>

      {isScanning && (
        <QRScanner 
          onScan={(code) => {
            const product = products.find(p => p.barcode === code);
            if (product) {
              addToCart(product);
              toast.success(`Added ${product.name}`);
            } else {
              toast.error('Product not found');
            }
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {isSelectingCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Select Customer</h3>
                <button onClick={() => setIsSelectingCustomer(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500">
                  <CheckCircle2 size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by name or phone..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Customers</div>
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsSelectingCustomer(false);
                        setCustomerSearch('');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {customer.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</div>
                          <div className="text-[10px] text-zinc-500">{customer.phone || 'No phone'}</div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-primary">{customer.loyaltyPoints} pts</div>
                    </button>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <div className="py-8 text-center text-zinc-400 italic text-sm">No results found</div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => setIsSelectingCustomer(false)}
                  className="w-full py-3 text-zinc-500 font-bold text-sm"
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
