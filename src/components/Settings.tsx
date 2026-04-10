import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Settings as SettingsIcon, 
  Store, 
  Palette, 
  Save,
  RefreshCw,
  Users as UsersIcon,
  Plus,
  Trash2,
  Shield,
  Key
} from 'lucide-react';
import { db, User } from '../db';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const [storeName, setStoreName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f97316');

  // New Staff State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'cashier'>('cashier');

  // Edit Staff State
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editPinValue, setEditPinValue] = useState('');

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setPrimaryColor(settings.primaryColor);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      if (settings?.id) {
        await db.settings.update(settings.id, { storeName, primaryColor });
      } else {
        await db.settings.add({ storeName, primaryColor, currency: 'PHP' });
      }
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName || newStaffPin.length < 4) {
      toast.error('Please provide a name and a 4-digit PIN');
      return;
    }

    try {
      await db.users.add({
        name: newStaffName,
        pin: newStaffPin,
        role: newStaffRole,
        createdAt: Date.now()
      });
      setNewStaffName('');
      setNewStaffPin('');
      toast.success('Staff member added successfully');
    } catch (error) {
      toast.error('Failed to add staff member');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (users.length <= 1) {
      toast.error('Cannot delete the last user');
      return;
    }
    try {
      await db.users.delete(id);
      toast.success('Staff member removed');
    } catch (error) {
      toast.error('Failed to remove staff');
    }
  };

  const handleUpdatePin = async (id: number) => {
    if (editPinValue.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }

    try {
      await db.users.update(id, { pin: editPinValue });
      setEditingUserId(null);
      setEditPinValue('');
      toast.success('PIN updated successfully');
    } catch (error) {
      toast.error('Failed to update PIN');
    }
  };

  const themes = [
    { name: 'Orange (Default)', color: '#f97316' },
    { name: 'Blue', color: '#2563eb' },
    { name: 'Green', color: '#16a34a' },
    { name: 'Purple', color: '#9333ea' },
    { name: 'Red', color: '#dc2626' },
    { name: 'Zinc', color: '#18181b' },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <Store className="text-zinc-400 dark:text-zinc-500" size={24} />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">General Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Store Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all font-bold text-zinc-900 dark:text-zinc-100"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <Palette className="text-zinc-400 dark:text-zinc-500" size={24} />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Appearance & Theme</h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Primary Color Theme</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.color}
                  onClick={() => setPrimaryColor(theme.color)}
                  className={`aspect-square rounded-2xl border-4 transition-all flex items-center justify-center ${
                    primaryColor === theme.color ? 'border-zinc-900 dark:border-zinc-100 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  {primaryColor === theme.color && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Custom Hex Color</label>
            <div className="flex gap-4">
              <input 
                type="color" 
                className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <input 
                type="text" 
                className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all font-mono text-zinc-900 dark:text-zinc-100"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <UsersIcon className="text-zinc-400 dark:text-zinc-500" size={24} />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Staff Management</h3>
        </div>
        <div className="p-8 space-y-8">
          {/* Add Staff Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all text-sm font-bold"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Staff Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PIN (4-6 digits)</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all text-sm font-bold"
                value={newStaffPin}
                onChange={(e) => setNewStaffPin(e.target.value)}
                placeholder="Enter PIN"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-primary outline-none transition-all text-sm font-bold"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'cashier')}
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
                <button 
                  onClick={handleAddStaff}
                  className="p-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Active Staff</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.name}</div>
                        <div className="flex items-center gap-1">
                          <Shield size={10} className={user.role === 'admin' ? 'text-primary' : 'text-zinc-400'} />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{user.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setEditingUserId(user.id || null);
                          setEditPinValue('');
                        }}
                        className="p-2 text-zinc-400 hover:text-primary transition-colors"
                        title="Change PIN"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => user.id && handleDeleteStaff(user.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                        title="Delete Staff"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {editingUserId === user.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2"
                    >
                      <input 
                        type="password" 
                        placeholder="New PIN"
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-light outline-none"
                        value={editPinValue}
                        onChange={(e) => setEditPinValue(e.target.value)}
                      />
                      <button 
                        onClick={() => handleUpdatePin(user.id!)}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110"
                      >
                        Update
                      </button>
                      <button 
                        onClick={() => setEditingUserId(null)}
                        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:brightness-110 shadow-xl shadow-primary-light transition-all active:scale-95"
        >
          <Save size={20} />
          Save All Changes
        </button>
      </div>
    </div>
  );
}
