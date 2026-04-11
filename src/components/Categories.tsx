import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Category } from '../db';
import { Plus, Trash2, Edit2, X, Check, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function Categories() {
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await db.categories.add({
        name: newCategoryName.trim(),
        createdAt: Date.now()
      });
      setNewCategoryName('');
      setIsAdding(false);
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await db.categories.update(id, { name: editName.trim() });
      setEditingId(null);
      toast.success('Category updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    // Check if any products use this category
    const productsUsing = await db.products.where('category').equals(name).count();
    if (productsUsing > 0) {
      toast.error(`Cannot delete: ${productsUsing} products are assigned to this category`);
      return;
    }

    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await db.categories.delete(id);
        toast.success('Category deleted');
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Product Categories</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your custom product categories</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:brightness-110 shadow-lg shadow-primary-light transition-all"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <form onSubmit={handleAdd} className="flex gap-4">
              <input
                autoFocus
                type="text"
                placeholder="Category Name (e.g. Beverages, Snacks)"
                className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-zinc-900 dark:text-zinc-100"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group"
          >
            {editingId === category.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  className="flex-1 px-3 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button
                  onClick={() => handleUpdate(category.id!)}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Settings size={20} />
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{category.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(category.id!);
                      setEditName(category.name);
                    }}
                    className="p-2 text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id!, category.name)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Settings size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">No categories found. Add your first one!</p>
        </div>
      )}
    </div>
  );
}
