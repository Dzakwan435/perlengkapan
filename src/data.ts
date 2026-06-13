import {
  InventoryItem,
  InventoryCategory,
  Program,
  PoskoNeed,
  ProgramNeed,
  Borrowing,
  BorrowingDetail,
  Procurement,
  Division,
} from './types';

export const USER_AVATAR =
  'https://lh3.googleusercontent.com/a/ACg8ocIvle966BZXQ0l_PfrBqeDQcMbMtarMDr25ib_o7TSS1xt7x0U=s96-c';

// ===================== USERS =====================
export const CURRENT_USER = {
  id: 'user-001',
  full_name: 'Dzakwan Abbas',
  email: 'admin@kkn.com',
  role: 'ADMIN' as const,
};

// ===================== INVENTORY CATEGORIES =====================
// Default master kategori; ID dibuat stabil agar seed inventory bisa mereferensikannya.
export const INITIAL_INVENTORY_CATEGORIES: InventoryCategory[] = [
  { id: 'cat-elektronik', name: 'Elektronik', created_at: new Date().toISOString() },
  { id: 'cat-perkakas',   name: 'Perkakas',   created_at: new Date().toISOString() },
  { id: 'cat-kebersihan', name: 'Kebersihan', created_at: new Date().toISOString() },
  { id: 'cat-kesehatan',  name: 'Kesehatan',  created_at: new Date().toISOString() },
];

// ===================== DIVISIONS =====================
export const INITIAL_DIVISIONS: Division[] = [
  { id: 'div-acara',        name: 'Acara',        created_at: new Date().toISOString() },
  { id: 'div-bph',          name: 'BPH',          created_at: new Date().toISOString() },
  { id: 'div-perlengkapan', name: 'Perlengkapan', created_at: new Date().toISOString() },
  { id: 'div-pdd',          name: 'PDD',          created_at: new Date().toISOString() },
  { id: 'div-humas',        name: 'Humas',        created_at: new Date().toISOString() },
];

// ===================== INVENTORY =====================
// category_id direferensikan ke INITIAL_INVENTORY_CATEGORIES di atas.
export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    item_name: 'Kursi Plastik',
    category: 'Perkakas',
    category_id: 'cat-perkakas',
    quantity: 50,
    condition: 'Baik',
    storage_location: 'Gudang Posko',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-002',
    item_name: 'Meja Lipat',
    category: 'Perkakas',
    category_id: 'cat-perkakas',
    quantity: 10,
    condition: 'Baik',
    storage_location: 'Gudang Posko',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-003',
    item_name: 'Speaker',
    category: 'Elektronik',
    category_id: 'cat-elektronik',
    quantity: 2,
    condition: 'Baik',
    storage_location: 'Gudang Posko',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-004',
    item_name: 'Microphone',
    category: 'Elektronik',
    category_id: 'cat-elektronik',
    quantity: 4,
    condition: 'Baik',
    storage_location: 'Gudang Posko',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-005',
    item_name: 'Kabel Roll',
    category: 'Elektronik',
    category_id: 'cat-elektronik',
    quantity: 5,
    condition: 'Baik',
    storage_location: 'Gudang Posko',
    created_at: new Date().toISOString(),
  },
];

// ===================== PROGRAMS =====================
export const INITIAL_PROGRAMS: Program[] = [
  {
    id: 'prog-001',
    name: 'Seminar Digitalisasi UMKM',
    description: 'Pelatihan UMKM Desa',
    event_date: '2026-08-15',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prog-002',
    name: 'Gotong Royong Desa',
    description: 'Kegiatan kebersihan lingkungan',
    event_date: '2026-08-20',
    created_at: new Date().toISOString(),
  },
];

// ===================== POSKO NEEDS =====================
export const INITIAL_POSKO_NEEDS: PoskoNeed[] = [
  {
    id: 'posko-001',
    item_name: 'Air Galon',
    quantity: 5,
    status: 'Sudah Dibeli',
    notes: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'posko-002',
    item_name: 'Gas LPG',
    quantity: 2,
    status: 'Belum Dibeli',
    notes: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'posko-003',
    item_name: 'Tisu',
    quantity: 10,
    status: 'Sudah Dibeli',
    notes: '',
    created_at: new Date().toISOString(),
  },
];

// ===================== PROGRAM NEEDS =====================
export const INITIAL_PROGRAM_NEEDS: ProgramNeed[] = [
  {
    id: 'pn-001',
    program_id: 'prog-001',
    item_name: 'Kursi Plastik',
    quantity: 50,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pn-002',
    program_id: 'prog-001',
    item_name: 'Speaker',
    quantity: 1,
    created_at: new Date().toISOString(),
  },
];

// ===================== BORROWINGS =====================
export const INITIAL_BORROWINGS: Borrowing[] = [
  {
    id: 'bor-001',
    program_id: 'prog-001',
    borrow_date: new Date().toISOString().split('T')[0],
    status: 'Dipinjam',
    created_at: new Date().toISOString(),
  },
];

// ===================== BORROWING DETAILS =====================
export const INITIAL_BORROWING_DETAILS: BorrowingDetail[] = [
  {
    id: 'bd-001',
    borrowing_id: 'bor-001',
    inventory_id: 'inv-001',
    quantity: 50,
  },
  {
    id: 'bd-002',
    borrowing_id: 'bor-001',
    inventory_id: 'inv-003',
    quantity: 1,
  },
];

// ===================== PROCUREMENTS =====================
export const INITIAL_PROCUREMENTS: Procurement[] = [
  {
    id: 'proc-001',
    item_name: 'Spanduk Seminar',
    quantity: 2,
    estimated_price: 250000,
    reason: 'Kegiatan Seminar UMKM',
    status: 'Menunggu',
    division_id: 'div-bph',
    category_id: 'cat-perkakas',
    procurement_type: 'inventaris',
    created_at: new Date().toISOString(),
  },
];
