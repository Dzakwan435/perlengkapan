import { createClient } from '@/utils/supabase/client';
import type {
  InventoryItem,
  InventoryCategory,
  Program,
  PoskoNeed,
  ProgramNeed,
  Borrowing,
  BorrowingDetail,
  Procurement,
  Division,
} from '../types';

const db = createClient;

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return new Error(String((e as { message: unknown }).message));
  }
  return new Error('Supabase error');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (table: string) => (db() as any).from(table);

// Helper: resolve nama kategori dari item (prioritas relasi, fallback ke kolom text)
export function resolveCategoryName(item: InventoryItem): string {
  if (item.categories?.name) return item.categories.name;
  return item.category ?? 'Tanpa Kategori';
}

// Helper: resolve nama divisi dari pengadaan
export function resolveDivisionName(proc: Procurement): string | null {
  if (proc.divisions?.name) return proc.divisions.name;
  return null;
}

// Helper: resolve nama kategori tujuan dari pengadaan
export function resolveProcurementCategoryName(proc: Procurement): string | null {
  if (proc.categories?.name) return proc.categories.name;
  return null;
}

// ============================================================
// INVENTORY CATEGORIES
// ============================================================

export async function fetchInventoryCategories(): Promise<InventoryCategory[]> {
  const { data, error } = await q('inventory_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw toError(error);
  return (data ?? []) as InventoryCategory[];
}

export async function insertInventoryCategory(
  name: string
): Promise<InventoryCategory> {
  const { data, error } = await q('inventory_categories')
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw toError(error);
  return data as InventoryCategory;
}

export async function updateInventoryCategory(
  id: string,
  name: string
): Promise<InventoryCategory> {
  const { data, error } = await q('inventory_categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw toError(error);
  return data as InventoryCategory;
}

export async function deleteInventoryCategory(id: string): Promise<void> {
  const { error } = await q('inventory_categories').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// DIVISIONS
// ============================================================

export async function fetchDivisions(): Promise<Division[]> {
  const { data, error } = await q('divisions')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw toError(error);
  return (data ?? []) as Division[];
}

export async function insertDivision(name: string): Promise<Division> {
  const { data, error } = await q('divisions')
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw toError(error);
  return data as Division;
}

export async function updateDivision(
  id: string,
  name: string
): Promise<Division> {
  const { data, error } = await q('divisions')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw toError(error);
  return data as Division;
}

export async function deleteDivision(id: string): Promise<void> {
  const { error } = await q('divisions').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// INVENTORY
// ============================================================

export async function fetchInventory(): Promise<InventoryItem[]> {
  // Coba select dengan join kategori; jika kolom belum ada (migration belum
  // dijalankan), fallback ke select semua kolom dasar.
  const { data, error } = await q('inventory_items')
    .select('*, categories:inventory_categories(id,name)')
    .order('created_at', { ascending: false });
  if (error) {
    const { data: fallbackData, error: fallbackErr } = await q('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (fallbackErr) throw toError(fallbackErr);
    return (fallbackData ?? []) as InventoryItem[];
  }
  return (data ?? []) as InventoryItem[];
}

export async function insertInventoryItem(
  item: Omit<InventoryItem, 'id' | 'created_at' | 'categories'>
): Promise<InventoryItem> {
  const { data, error } = await q('inventory_items')
    .insert(item)
    .select('*, categories:inventory_categories(id,name)')
    .single();
  if (error) throw toError(error);
  return data as InventoryItem;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<Omit<InventoryItem, 'id' | 'created_at' | 'categories'>>
): Promise<InventoryItem> {
  const { data, error } = await q('inventory_items')
    .update(patch)
    .eq('id', id)
    .select('*, categories:inventory_categories(id,name)')
    .single();
  if (error) throw toError(error);
  return data as InventoryItem;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await q('inventory_items').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// PROGRAMS
// ============================================================

export async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await q('programs')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw toError(error);
  return (data ?? []) as Program[];
}

export async function insertProgram(
  program: Omit<Program, 'id' | 'created_at'>
): Promise<Program> {
  const { data, error } = await q('programs')
    .insert(program)
    .select()
    .single();
  if (error) throw toError(error);
  return data as Program;
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await q('programs').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// PROGRAM NEEDS
// ============================================================

export async function fetchProgramNeeds(): Promise<ProgramNeed[]> {
  const { data, error } = await q('program_needs')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw toError(error);
  return (data ?? []) as ProgramNeed[];
}

export async function insertProgramNeed(
  need: Omit<ProgramNeed, 'id' | 'created_at'>
): Promise<ProgramNeed> {
  const { data, error } = await q('program_needs')
    .insert(need)
    .select()
    .single();
  if (error) throw toError(error);
  return data as ProgramNeed;
}

export async function deleteProgramNeed(id: string): Promise<void> {
  const { error } = await q('program_needs').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// POSKO NEEDS
// ============================================================

export async function fetchPoskoNeeds(): Promise<PoskoNeed[]> {
  const { data, error } = await q('posko_needs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw toError(error);
  return (data ?? []) as PoskoNeed[];
}

export async function insertPoskoNeed(
  need: Omit<PoskoNeed, 'id' | 'created_at'>
): Promise<PoskoNeed> {
  const { data, error } = await q('posko_needs')
    .insert(need)
    .select()
    .single();
  if (error) throw toError(error);
  return data as PoskoNeed;
}

export async function updatePoskoNeed(
  id: string,
  patch: Partial<Omit<PoskoNeed, 'id' | 'created_at'>>
): Promise<PoskoNeed> {
  const { data, error } = await q('posko_needs')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw toError(error);
  return data as PoskoNeed;
}

export async function deletePoskoNeed(id: string): Promise<void> {
  const { error } = await q('posko_needs').delete().eq('id', id);
  if (error) throw toError(error);
}

// ============================================================
// BORROWINGS
// ============================================================

export async function fetchBorrowings(): Promise<Borrowing[]> {
  const { data, error } = await q('borrowings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw toError(error);
  return (data ?? []) as Borrowing[];
}

export async function insertBorrowing(
  borrowing: Omit<Borrowing, 'id' | 'created_at'>
): Promise<Borrowing> {
  const { data, error } = await q('borrowings')
    .insert(borrowing)
    .select()
    .single();
  if (error) throw toError(error);
  return data as Borrowing;
}

export async function updateBorrowing(
  id: string,
  patch: Partial<Omit<Borrowing, 'id' | 'created_at'>>
): Promise<Borrowing> {
  const { data, error } = await q('borrowings')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw toError(error);
  return data as Borrowing;
}

// ============================================================
// BORROWING DETAILS
// ============================================================

export async function fetchBorrowingDetails(): Promise<BorrowingDetail[]> {
  const { data, error } = await q('borrowing_details').select('*');
  if (error) throw toError(error);
  return (data ?? []) as BorrowingDetail[];
}

export async function insertBorrowingDetails(
  details: Omit<BorrowingDetail, 'id'>[]
): Promise<BorrowingDetail[]> {
  const { data, error } = await q('borrowing_details')
    .insert(details)
    .select();
  if (error) throw toError(error);
  return (data ?? []) as BorrowingDetail[];
}

// ============================================================
// RETURNS
// ============================================================

export async function insertReturn(ret: {
  borrowing_id: string;
  return_date: string;
  item_condition: 'Baik' | 'Rusak' | 'Hilang';
  notes: string;
}): Promise<void> {
  const { error } = await q('returns').insert(ret);
  if (error) throw toError(error);
}

// ============================================================
// PROCUREMENTS
// ============================================================

export async function fetchProcurements(): Promise<Procurement[]> {
  const { data, error } = await q('procurements')
    .select('*, divisions:divisions(id,name), categories:inventory_categories(id,name)')
    .order('created_at', { ascending: false });
  if (error) {
    const { data: fallbackData, error: fallbackErr } = await q('procurements')
      .select('*')
      .order('created_at', { ascending: false });
    if (fallbackErr) throw toError(fallbackErr);
    return (fallbackData ?? []) as Procurement[];
  }
  return (data ?? []) as Procurement[];
}

export async function insertProcurement(
  proc: Omit<Procurement, 'id' | 'created_at' | 'divisions' | 'categories'>
): Promise<Procurement> {
  const { data, error } = await q('procurements')
    .insert(proc)
    .select('*, divisions:divisions(id,name), categories:inventory_categories(id,name)')
    .single();
  if (error) throw toError(error);
  return data as Procurement;
}

export async function updateProcurement(
  id: string,
  patch: Partial<Omit<Procurement, 'id' | 'created_at' | 'divisions' | 'categories'>>
): Promise<Procurement> {
  const { data, error } = await q('procurements')
    .update(patch)
    .eq('id', id)
    .select('*, divisions:divisions(id,name), categories:inventory_categories(id,name)')
    .single();
  if (error) throw toError(error);
  return data as Procurement;
}

export async function deleteProcurement(id: string): Promise<void> {
  const { error } = await q('procurements').delete().eq('id', id);
  if (error) throw toError(error);
}
