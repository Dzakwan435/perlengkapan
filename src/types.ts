// ============================================================
// Core domain types matching the SQL schema
// ============================================================

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'BENDAHARA';
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  event_date: string; // ISO date string YYYY-MM-DD
  created_at: string;
}

// Master kategori inventaris (tabel: inventory_categories)
export interface InventoryCategory {
  id: string;
  name: string;
  created_at: string;
}

// Master divisi pengadaan (tabel: divisions)
export interface Division {
  id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string | null;       // (legacy) dipertahankan untuk migrasi, jangan dipakai di UI baru
  category_id: string | null;    // FK -> inventory_categories.id
  quantity: number;
  condition: 'Baik' | 'Rusak' | 'Hilang';
  storage_location: string;
  created_at: string;

  // Joined dari relasi (opsional, ada saat di-select dengan join)
  categories?: InventoryCategory | null;
}

export interface PoskoNeed {
  id: string;
  item_name: string;
  quantity: number;
  status: 'Belum Dibeli' | 'Sudah Dibeli';
  notes: string | null;
  created_at: string;
}

export interface ProgramNeed {
  id: string;
  program_id: string;
  item_name: string;
  quantity: number;
  created_at: string;
}

export interface Borrowing {
  id: string;
  program_id: string | null;
  borrow_date: string; // ISO date string
  status: 'Dipinjam' | 'Kembali';
  created_at: string;
}

export interface BorrowingDetail {
  id: string;
  borrowing_id: string;
  inventory_id: string;
  quantity: number;
}

export interface Return {
  id: string;
  borrowing_id: string;
  return_date: string;
  item_condition: 'Baik' | 'Rusak' | 'Hilang';
  notes: string;
  created_at: string;
}

export type ProcurementType = 'inventaris' | 'posko';

export interface Procurement {
  id: string;
  item_name: string;
  quantity: number;
  estimated_price: number;
  reason: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  division_id: string | null;    // FK -> divisions.id
  category_id: string | null;    // FK -> inventory_categories.id (kategori tujuan saat disetujui)
  procurement_type: ProcurementType; // 'inventaris' -> inventory_items, 'posko' -> posko_needs
  created_at: string;

  // Joined dari relasi (opsional, ada saat di-select dengan join)
  divisions?: Division | null;
  categories?: InventoryCategory | null;
}

// ============================================================
// UI helper types
// ============================================================

export type TabType = 'dashboard' | 'inventory' | 'programs' | 'posko' | 'procurements';

// Borrowing joined with program name and details for display
export interface BorrowingView extends Borrowing {
  program_name: string | null;
  details: (BorrowingDetail & { item_name: string })[];
}

// Helper: InventoryItem yang sudah di-resolve nama kategorinya
export type ResolvedInventoryItem = InventoryItem & {
  category_name: string;
};

// Helper: Procurement yang sudah di-resolve nama divisinya
export type ResolvedProcurement = Procurement & {
  division_name: string | null;
};
