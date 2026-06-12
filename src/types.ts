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

export interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  condition: 'Baik' | 'Rusak' | 'Hilang';
  storage_location: string;
  created_at: string;
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

export interface Procurement {
  id: string;
  item_name: string;
  quantity: number;
  estimated_price: number;
  reason: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  created_at: string;
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
