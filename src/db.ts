import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  image?: string;
  barcode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Sale {
  id?: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    name: string;
  }>;
  total: number;
  paymentMethod: 'cash' | 'card' | 'stripe' | 'credit';
  customerId?: number;
  timestamp: number;
  processedBy?: string; // User name or ID
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  loyaltyPoints: number;
  creditBalance: number;
  createdAt: number;
}

export interface ZakatRecord {
  id?: number;
  year: number;
  totalWealth: number;
  zakatAmount: number;
  status: 'calculated' | 'paid';
  timestamp: number;
}

export interface AppSettings {
  id?: number;
  storeName: string;
  primaryColor: string;
  currency: string;
  goldPricePerGram?: number;
  silverPricePerGram?: number;
}

export interface User {
  id?: number;
  name: string;
  pin: string;
  role: 'admin' | 'cashier';
  createdAt: number;
}

export interface Category {
  id?: number;
  name: string;
  createdAt: number;
}

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  zakat!: Table<ZakatRecord>;
  settings!: Table<AppSettings>;
  users!: Table<User>;
  categories!: Table<Category>;

  constructor() {
    super('POSDatabase');
    this.version(8).stores({
      products: '++id, sku, name, category, barcode',
      sales: '++id, timestamp, processedBy',
      customers: '++id, phone, email',
      zakat: '++id, year',
      settings: '++id',
      users: '++id, pin, role',
      categories: '++id, name'
    });
  }
}

export const db = new POSDatabase();

export async function seedData() {
  // Clear existing data as requested by user
  const hasCleared = localStorage.getItem('data_cleared_v1');
  if (!hasCleared) {
    await db.products.clear();
    await db.customers.clear();
    await db.sales.clear();
    localStorage.setItem('data_cleared_v1', 'true');
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      storeName: 'YusraPOS',
      primaryColor: '#f97316', // orange-600
      currency: 'PHP',
      goldPricePerGram: 3800 // Approximate PHP price per gram of 24k gold
    });
  }

  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.add({
      name: 'Admin',
      pin: '1443',
      role: 'admin',
      createdAt: Date.now()
    });
  } else {
    // Ensure the default admin PIN is updated if it was the old one
    const admin = await db.users.where({ name: 'Admin', role: 'admin' }).first();
    if (admin && admin.pin === '1234') {
      await db.users.update(admin.id!, { pin: '1443' });
    }
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const defaultCategories = ['General', 'Electronics', 'Food & Beverage', 'Clothing', 'Home & Living', 'Health & Beauty', 'Other'];
    await db.categories.bulkAdd(defaultCategories.map(name => ({ name, createdAt: Date.now() })));
  }
}

