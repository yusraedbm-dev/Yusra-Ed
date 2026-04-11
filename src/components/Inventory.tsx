import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Minus,
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  QrCode, 
  Camera,
  AlertCircle,
  Package,
  GripHorizontal
} from 'lucide-react';
import { db, type Product } from '../db';
import QRScanner from './QRScanner';
import { toast } from 'sonner';
import { motion, useDragControls } from 'motion/react';

export default function Inventory() {
  const dragControls = useDragControls();
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockToAdd, setStockToAdd] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const currency = settings?.currency || 'PHP';

  const updateStock = async (productId: number, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    try {
      await db.products.update(productId, {
        stock: Math.max(0, product.stock + delta),
        updatedAt: Date.now()
      });
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: 'General',
    barcode: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await db.products.update(editingProduct.id!, {
          ...newProduct as Product,
          updatedAt: Date.now()
        });
        toast.success('Product updated successfully');
      } else {
        await db.products.add({
          ...newProduct as Product,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        toast.success('Product added successfully');
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setNewProduct({ name: '', sku: '', price: 0, cost: 0, stock: 0, category: 'General', barcode: '' });
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAddingProduct(true);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock || stockToAdd <= 0) return;
    try {
      await db.products.update(selectedProductForStock.id!, {
        stock: selectedProductForStock.stock + stockToAdd,
        updatedAt: Date.now()
      });
      toast.success(`Added ${stockToAdd} to ${selectedProductForStock.name}`);
      setIsAddingStock(false);
      setSelectedProductForStock(null);
      setStockToAdd(0);
    } catch (error) {
      toast.error('Failed to add stock');
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await db.products.delete(id);
      toast.success('Product deleted');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, SKU, or barcode..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition-all text-zinc-900 dark:text-zinc-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <QrCode size={18} />
            Scan
          </button>
          <button 
            onClick={() => setIsAddingProduct(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary-light"
          >
            <Plus size={18} />
            Add Product
          </button>
          <button 
            onClick={() => setIsAddingStock(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg shadow-green-600/20"
          >
            <Plus size={18} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Product List</h3>
          <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{products.length} Products</div>
        </div>
        
        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-zinc-300 dark:text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{product.name}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">#{product.barcode || 'NO-BARCODE'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStock(product.id!, -1); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                      <Minus size={12} />
                    </button>
                    <span className={`px-2 text-[10px] font-bold uppercase ${
                      product.stock < 10 ? 'text-primary' : 'text-green-700 dark:text-green-400'
                    }`}>
                      {product.stock}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateStock(product.id!, 1); }}
                      className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(product.price)}</span>
                </div>
              </div>
              <button 
                onClick={() => handleEditProduct(product)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-zinc-400 dark:text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{product.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{product.barcode || 'No Barcode'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-mono">{product.sku}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold uppercase">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <button 
                          onClick={() => updateStock(product.id!, -1)}
                          className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                        >
                          <Minus size={12} />
                        </button>
                        <span className={`text-sm font-bold w-8 text-center ${product.stock < 10 ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {product.stock}
                        </span>
                        <button 
                          onClick={() => updateStock(product.id!, 1)}
                          className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-zinc-600 dark:text-zinc-400"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {product.stock < 10 && <AlertCircle size={14} className="text-primary" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedProductForStock(product);
                          setIsAddingStock(true);
                        }}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg text-zinc-400 hover:text-green-600 dark:hover:text-green-400"
                        title="Add Stock"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id!)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-zinc-400 italic text-sm">No products found</div>
        )}
      </div>

      {/* Add Stock Modal */}
      {isAddingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Add Stock</h3>
              <button onClick={() => { setIsAddingStock(false); setSelectedProductForStock(null); }} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select Product</label>
                <select 
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  value={selectedProductForStock?.id || ''}
                  onChange={(e) => setSelectedProductForStock(products.find(p => p.id === parseInt(e.target.value)) || null)}
                  required
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quantity to Add</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => { setIsAddingStock(false); setSelectedProductForStock(null); }}
                  className="px-4 py-2 text-zinc-500 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary-light"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Package size={20} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsAddingProduct(false);
                  setEditingProduct(null);
                  setNewProduct({ name: '', sku: '', price: 0, cost: 0, stock: 0, category: 'General', barcode: '' });
                }} 
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Form Fields */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Product Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. Gold Necklace"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all"
                          value={newProduct.name}
                          onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">SKU / Model</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. GN-001"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-mono"
                          value={newProduct.sku}
                          onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selling Price ({currency})</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-bold"
                          value={newProduct.price}
                          onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cost Price ({currency})</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-bold"
                          value={newProduct.cost}
                          onChange={e => setNewProduct({...newProduct, cost: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                        <select 
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-bold"
                          value={newProduct.category}
                          onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Initial Stock</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-bold"
                          value={newProduct.stock}
                          onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Barcode / QR Code</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Scan or enter code"
                          className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none text-zinc-900 dark:text-zinc-100 transition-all font-mono"
                          value={newProduct.barcode}
                          onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={() => setIsScanning(true)}
                          className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                        >
                          <QrCode size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview & Image */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Product Preview</label>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-white dark:bg-zinc-900 rounded-2xl shadow-inner border border-zinc-100 dark:border-zinc-800 mb-4 flex items-center justify-center overflow-hidden relative group">
                          {newProduct.image ? (
                            <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={48} className="text-zinc-200 dark:text-zinc-700" />
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            id="product-image"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewProduct({...newProduct, image: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="product-image"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            <Camera className="text-white" size={24} />
                          </label>
                        </div>
                        <div className="w-full">
                          <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 truncate">
                            {newProduct.name || 'Product Name'}
                          </div>
                          <div className="text-sm font-bold text-primary mt-1">
                            {formatCurrency(newProduct.price || 0)}
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase text-zinc-500">
                              {newProduct.category}
                            </span>
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase text-zinc-500">
                              {newProduct.stock} Units
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-primary mt-0.5" size={18} />
                        <div className="text-xs text-primary/80 leading-relaxed">
                          Ensure the <strong>SKU</strong> and <strong>Barcode</strong> are unique to avoid inventory conflicts.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    setNewProduct({ name: '', sku: '', price: 0, cost: 0, stock: 0, category: 'General', barcode: '' });
                  }}
                  className="px-6 py-3 text-zinc-600 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-10 py-3 bg-primary text-white font-black rounded-2xl hover:brightness-110 shadow-xl shadow-primary-light transition-all active:scale-95 order-1 sm:order-2"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isScanning && (
        <QRScanner 
          onScan={(code) => {
            if (isAddingProduct) {
              setNewProduct({...newProduct, barcode: code});
            } else {
              setSearchTerm(code);
            }
          }} 
          onClose={() => setIsScanning(false)} 
        />
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
