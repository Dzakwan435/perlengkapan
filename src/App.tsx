'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  ShoppingCart,
  Home,
  Loader2,
} from 'lucide-react';
import {
  TabType,
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
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import ProgramsView from './components/ProgramsView';
import PoskoView from './components/PoskoView';
import ProcurementsView from './components/ProcurementsView';
import {
  BorrowModal,
  ProcurementModal,
  InventoryItemModal,
  ProgramModal,
  PoskoNeedModal,
  ProgramNeedModal,
  ReturnModal,
  CategoryManagerModal,
  DivisionManagerModal,
} from './components/Dialogs';
import * as db from './lib/supabase';

// ============================================================
// App
// ============================================================

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [poskoNeeds, setPoskoNeeds] = useState<PoskoNeed[]>([]);
  const [programNeeds, setProgramNeeds] = useState<ProgramNeed[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [borrowingDetails, setBorrowingDetails] = useState<BorrowingDetail[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modal states
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isProcurementOpen, setIsProcurementOpen] = useState(false);
  const [isInventoryItemOpen, setIsInventoryItemOpen] = useState(false);
  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isPoskoNeedOpen, setIsPoskoNeedOpen] = useState(false);
  const [isProgramNeedOpen, setIsProgramNeedOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isDivisionManagerOpen, setIsDivisionManagerOpen] = useState(false);

  // Edit states
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | undefined>();
  const [editingPoskoNeed, setEditingPoskoNeed] = useState<PoskoNeed | undefined>();
  const [editingProcurement, setEditingProcurement] = useState<Procurement | undefined>();
  const [returningBorrowingId, setReturningBorrowingId] = useState<string | null>(null);
  const [addNeedForProgramId, setAddNeedForProgramId] = useState<string | null>(null);

  // ============================================================
  // Initial data load
  // ============================================================
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, cats, divs, prog, posko, pn, bor, bd, proc] = await Promise.all([
        db.fetchInventory(),
        db.fetchInventoryCategories(),
        db.fetchDivisions(),
        db.fetchPrograms(),
        db.fetchPoskoNeeds(),
        db.fetchProgramNeeds(),
        db.fetchBorrowings(),
        db.fetchBorrowingDetails(),
        db.fetchProcurements(),
      ]);
      setInventory(inv);
      setCategories(cats);
      setDivisions(divs);
      setPrograms(prog);
      setPoskoNeeds(posko);
      setProgramNeeds(pn);
      setBorrowings(bor);
      setBorrowingDetails(bd);
      setProcurements(proc);
    } catch (e) {
      console.error('loadAll error:', e);
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Gagal memuat data dari Supabase';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const withMutation = async (fn: () => Promise<void>) => {
    setMutationError(null);
    try {
      await fn();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Terjadi kesalahan';
      console.error('Mutation error:', e);
      setMutationError(msg);
    }
  };

  // ============================================================
  // Category handlers
  // ============================================================
  const handleAddCategory = async (name: string) => {
    const created = await db.insertInventoryCategory(name);
    setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    const updated = await db.updateInventoryCategory(id, name);
    setCategories(prev =>
      prev.map(c => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    // Kategori berubah → nama kategori pada item ikut diperbarui via relasi;
    // cukup refresh inventaris agar nama ter-join ter-update.
    try {
      const refreshed = await db.fetchInventory();
      setInventory(refreshed);
    } catch (err) {
      console.error('refresh inventory after category update failed', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await db.deleteInventoryCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    // FK ON DELETE SET NULL → item.category_id akan otomatis null di DB.
    // Sinkronkan state lokal juga.
    setInventory(prev =>
      prev.map(item =>
        item.category_id === id
          ? { ...item, category_id: null, categories: null }
          : item
      )
    );
  };

  // ============================================================
  // Division handlers
  // ============================================================
  const handleAddDivision = async (name: string) => {
    const created = await db.insertDivision(name);
    setDivisions(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleUpdateDivision = async (id: string, name: string) => {
    const updated = await db.updateDivision(id, name);
    setDivisions(prev =>
      prev.map(d => (d.id === id ? updated : d)).sort((a, b) => a.name.localeCompare(b.name))
    );
    try {
      const refreshed = await db.fetchProcurements();
      setProcurements(refreshed);
    } catch (err) {
      console.error('refresh procurements after division update failed', err);
    }
  };

  const handleDeleteDivision = async (id: string) => {
    await db.deleteDivision(id);
    setDivisions(prev => prev.filter(d => d.id !== id));
    setProcurements(prev =>
      prev.map(p =>
        p.division_id === id ? { ...p, division_id: null, divisions: null } : p
      )
    );
  };

  // ============================================================
  // Inventory handlers
  // ============================================================
  const handleSaveInventoryItem = (
    data: Omit<InventoryItem, 'id' | 'created_at' | 'categories'>
  ) =>
    withMutation(async () => {
      if (editingInventoryItem) {
        const updated = await db.updateInventoryItem(editingInventoryItem.id, data);
        setInventory(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await db.insertInventoryItem(data);
        setInventory(prev => [created, ...prev]);
      }
      setEditingInventoryItem(undefined);
      setIsInventoryItemOpen(false);
    });

  const handleDeleteInventoryItem = (id: string) =>
    withMutation(async () => {
      await db.deleteInventoryItem(id);
      setInventory(prev => prev.filter(i => i.id !== id));
    });

  // ============================================================
  // Program handlers
  // ============================================================
  const handleSaveProgram = (data: Omit<Program, 'id' | 'created_at'>) =>
    withMutation(async () => {
      const created = await db.insertProgram(data);
      setPrograms(prev => [created, ...prev]);
      setIsProgramOpen(false);
    });

  const handleDeleteProgram = (id: string) =>
    withMutation(async () => {
      await db.deleteProgram(id);
      setPrograms(prev => prev.filter(p => p.id !== id));
      setProgramNeeds(prev => prev.filter(pn => pn.program_id !== id));
    });

  // ============================================================
  // Program Need handlers
  // ============================================================
  const handleSaveProgramNeed = (data: Omit<ProgramNeed, 'id' | 'created_at'>) =>
    withMutation(async () => {
      const created = await db.insertProgramNeed(data);
      setProgramNeeds(prev => [...prev, created]);
      setIsProgramNeedOpen(false);
      setAddNeedForProgramId(null);
    });

  const handleDeleteProgramNeed = (id: string) =>
    withMutation(async () => {
      await db.deleteProgramNeed(id);
      setProgramNeeds(prev => prev.filter(pn => pn.id !== id));
    });

  // ============================================================
  // Posko Need handlers
  // ============================================================
  const handleSavePoskoNeed = (data: Omit<PoskoNeed, 'id' | 'created_at'>) =>
    withMutation(async () => {
      if (editingPoskoNeed) {
        const updated = await db.updatePoskoNeed(editingPoskoNeed.id, data);
        setPoskoNeeds(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await db.insertPoskoNeed(data);
        setPoskoNeeds(prev => [created, ...prev]);
      }
      setEditingPoskoNeed(undefined);
      setIsPoskoNeedOpen(false);
    });

  const handleTogglePoskoStatus = (id: string) =>
    withMutation(async () => {
      const need = poskoNeeds.find(p => p.id === id);
      if (!need) return;
      const newStatus = need.status === 'Belum Dibeli' ? 'Sudah Dibeli' : 'Belum Dibeli';
      const updated = await db.updatePoskoNeed(id, { status: newStatus });
      setPoskoNeeds(prev => prev.map(p => p.id === id ? updated : p));
    });

  const handleDeletePoskoNeed = (id: string) =>
    withMutation(async () => {
      await db.deletePoskoNeed(id);
      setPoskoNeeds(prev => prev.filter(p => p.id !== id));
    });

  // ============================================================
  // Borrowing handlers
  // ============================================================
  const handleSaveBorrowing = (data: {
    program_id: string | null;
    borrow_date: string;
    details: { inventory_id: string; quantity: number }[];
  }) =>
    withMutation(async () => {
      const newBorrowing = await db.insertBorrowing({
        program_id: data.program_id,
        borrow_date: data.borrow_date,
        status: 'Dipinjam',
      });
      const newDetails = await db.insertBorrowingDetails(
        data.details.map(d => ({
          borrowing_id: newBorrowing.id,
          inventory_id: d.inventory_id,
          quantity: d.quantity,
        }))
      );
      setBorrowings(prev => [newBorrowing, ...prev]);
      setBorrowingDetails(prev => [...newDetails, ...prev]);
      setIsBorrowOpen(false);
    });

  const handleReturnBorrowing = (data: {
    borrowing_id: string;
    return_date: string;
    item_condition: 'Baik' | 'Rusak' | 'Hilang';
    notes: string;
  }) =>
    withMutation(async () => {
      await db.insertReturn(data);
      const updated = await db.updateBorrowing(data.borrowing_id, { status: 'Kembali' });
      setBorrowings(prev => prev.map(b => b.id === updated.id ? updated : b));

      const details = borrowingDetails.filter(d => d.borrowing_id === data.borrowing_id);
      await Promise.all(
        details.map(d => db.updateInventoryItem(d.inventory_id, { condition: data.item_condition }))
      );
      setInventory(prev =>
        prev.map(item =>
          details.some(d => d.inventory_id === item.id)
            ? { ...item, condition: data.item_condition }
            : item
        )
      );

      setReturningBorrowingId(null);
      setIsReturnOpen(false);
    });

  // ============================================================
  // Procurement handlers
  // ============================================================
  const handleSaveProcurement = (
    data: Omit<Procurement, 'id' | 'status' | 'created_at' | 'divisions'>
  ) =>
    withMutation(async () => {
      if (editingProcurement) {
        const updated = await db.updateProcurement(editingProcurement.id, data);
        setProcurements(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await db.insertProcurement({ ...data, status: 'Menunggu' });
        setProcurements(prev => [created, ...prev]);
      }
      setEditingProcurement(undefined);
      setIsProcurementOpen(false);
    });

  const handleDeleteProcurement = (id: string) =>
    withMutation(async () => {
      await db.deleteProcurement(id);
      setProcurements(prev => prev.filter(p => p.id !== id));
    });

  const handleApproveProcurement = (id: string) =>
    withMutation(async () => {
      const proc = procurements.find(p => p.id === id);
      if (!proc) return;

      const updated = await db.updateProcurement(id, { status: 'Disetujui' });
      setProcurements(prev => prev.map(p => p.id === id ? updated : p));

      if (proc.procurement_type === 'posko') {
        // Barang habis pakai -> tambahkan ke posko_needs dengan status 'Belum Dibeli'.
        // Jika nama item sama sudah ada, tambahkan quantity-nya.
        const existingNeed = poskoNeeds.find(
          n => n.item_name.toLowerCase() === proc.item_name.toLowerCase()
        );
        if (existingNeed) {
          const updatedNeed = await db.updatePoskoNeed(existingNeed.id, {
            quantity: existingNeed.quantity + proc.quantity,
          });
          setPoskoNeeds(prev => prev.map(n => n.id === existingNeed.id ? updatedNeed : n));
        } else {
          const created = await db.insertPoskoNeed({
            item_name: proc.item_name,
            quantity: proc.quantity,
            status: 'Belum Dibeli',
            notes: proc.reason?.trim()
              ? `Dari pengadaan${proc.divisions?.name ? ` Divisi ${proc.divisions.name}` : ''}`
              : null,
          });
          setPoskoNeeds(prev => [created, ...prev]);
        }
        return;
      }

      // Barang berulang -> masuk inventaris (default path)
      const existing = inventory.find(i => {
        if (i.item_name.toLowerCase() !== proc.item_name.toLowerCase()) return false;
        const iCat = i.category_id ?? null;
        const pCat = proc.category_id ?? null;
        return iCat === pCat;
      });

      if (existing) {
        const updatedItem = await db.updateInventoryItem(existing.id, {
          quantity: existing.quantity + proc.quantity,
        });
        setInventory(prev => prev.map(i => i.id === existing.id ? updatedItem : i));
      } else {
        const newItem = await db.insertInventoryItem({
          item_name: proc.item_name,
          category: null,
          category_id: proc.category_id,
          quantity: proc.quantity,
          condition: 'Baik',
          storage_location: 'Gudang Posko',
        });
        setInventory(prev => [newItem, ...prev]);
      }
    });

  const handleRejectProcurement = (id: string) =>
    withMutation(async () => {
      const updated = await db.updateProcurement(id, { status: 'Ditolak' });
      setProcurements(prev => prev.map(p => p.id === id ? updated : p));
    });

  // ============================================================
  // Render
  // ============================================================
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory' as TabType, label: 'Inventaris', icon: Package },
    { id: 'programs' as TabType, label: 'Program', icon: CalendarDays },
    { id: 'posko' as TabType, label: 'Posko', icon: Home },
    { id: 'procurements' as TabType, label: 'Pengadaan', icon: ShoppingCart },
  ];

  // Hitung jumlah item per kategori (untuk CategoryManagerModal)
  const itemCountsByCategoryId = inventory.reduce<Record<string, number>>((acc, item) => {
    if (item.category_id) acc[item.category_id] = (acc[item.category_id] ?? 0) + 1;
    return acc;
  }, {});

  // Hitung jumlah pengadaan per divisi (untuk DivisionManagerModal)
  const procCountsByDivisionId = procurements.reduce<Record<string, number>>((acc, p) => {
    if (p.division_id) acc[p.division_id] = (acc[p.division_id] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    const isMissingTable = error.toLowerCase().includes('relation') || error.toLowerCase().includes('does not exist');
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-sm w-full">
          <p className="text-rose-700 font-semibold mb-1">Gagal terhubung ke database</p>
          <p className="text-rose-500 text-sm mb-3 font-mono break-all">{error}</p>
          {isMissingTable && (
            <p className="text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-left">
              Tabel belum dibuat. Jalankan SQL script di Supabase Dashboard → SQL Editor terlebih dahulu.
            </p>
          )}
          <button
            onClick={loadAll}
            className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar />

      {/* Mutation error toast */}
      {mutationError && (
        <div className="fixed top-16 left-0 right-0 z-50 px-4 pt-2">
          <div className="bg-rose-600 text-white text-sm rounded-xl px-4 py-3 flex items-center justify-between shadow-lg max-w-lg mx-auto">
            <span className="flex-1 mr-3">{mutationError}</span>
            <button
              onClick={() => setMutationError(null)}
              className="flex-shrink-0 opacity-80 hover:opacity-100 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="pb-24 pt-[72px]">
        {activeTab === 'dashboard' && (
          <DashboardView
            inventory={inventory}
            categories={categories}
            borrowings={borrowings}
            borrowingDetails={borrowingDetails}
            programs={programs}
            poskoNeeds={poskoNeeds}
            procurements={procurements}
            divisions={divisions}
            onNavigate={setActiveTab}
            onOpenBorrow={() => setIsBorrowOpen(true)}
            onOpenProcurement={() => setIsProcurementOpen(true)}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            categories={categories}
            borrowings={borrowings}
            borrowingDetails={borrowingDetails}
            programs={programs}
            onAddItem={() => { setEditingInventoryItem(undefined); setIsInventoryItemOpen(true); }}
            onEditItem={(item) => { setEditingInventoryItem(item); setIsInventoryItemOpen(true); }}
            onDeleteItem={handleDeleteInventoryItem}
            onOpenBorrow={() => setIsBorrowOpen(true)}
            onReturnBorrowing={(id) => { setReturningBorrowingId(id); setIsReturnOpen(true); }}
            onManageCategories={() => setIsCategoryManagerOpen(true)}
          />
        )}
        {activeTab === 'programs' && (
          <ProgramsView
            programs={programs}
            programNeeds={programNeeds}
            inventory={inventory}
            onAddProgram={() => setIsProgramOpen(true)}
            onDeleteProgram={handleDeleteProgram}
            onAddNeed={(programId) => { setAddNeedForProgramId(programId); setIsProgramNeedOpen(true); }}
            onDeleteNeed={handleDeleteProgramNeed}
          />
        )}
        {activeTab === 'posko' && (
          <PoskoView
            poskoNeeds={poskoNeeds}
            onAddNeed={() => { setEditingPoskoNeed(undefined); setIsPoskoNeedOpen(true); }}
            onEditNeed={(need) => { setEditingPoskoNeed(need); setIsPoskoNeedOpen(true); }}
            onToggleStatus={handleTogglePoskoStatus}
            onDeleteNeed={handleDeletePoskoNeed}
          />
        )}
        {activeTab === 'procurements' && (
          <ProcurementsView
            procurements={procurements}
            divisions={divisions}
            onAddProcurement={() => { setEditingProcurement(undefined); setIsProcurementOpen(true); }}
            onEdit={(proc) => { setEditingProcurement(proc); setIsProcurementOpen(true); }}
            onDelete={handleDeleteProcurement}
            onApprove={handleApproveProcurement}
            onReject={handleRejectProcurement}
            onManageDivisions={() => setIsDivisionManagerOpen(true)}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors ${
                  active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      {isBorrowOpen && (
        <BorrowModal
          inventory={inventory}
          programs={programs}
          onSubmit={handleSaveBorrowing}
          onClose={() => setIsBorrowOpen(false)}
        />
      )}
      {isProcurementOpen && (
        <ProcurementModal
          editProc={editingProcurement}
          divisions={divisions}
          categories={categories}
          onSubmit={handleSaveProcurement}
          onClose={() => { setIsProcurementOpen(false); setEditingProcurement(undefined); }}
          onOpenDivisionManager={() => {
            setIsProcurementOpen(false);
            setEditingProcurement(undefined);
            setIsDivisionManagerOpen(true);
          }}
          onOpenCategoryManager={() => {
            setIsProcurementOpen(false);
            setEditingProcurement(undefined);
            setIsCategoryManagerOpen(true);
          }}
        />
      )}
      {isInventoryItemOpen && (
        <InventoryItemModal
          editItem={editingInventoryItem}
          categories={categories}
          onSubmit={handleSaveInventoryItem}
          onClose={() => { setIsInventoryItemOpen(false); setEditingInventoryItem(undefined); }}
          onOpenCategoryManager={() => {
            setIsInventoryItemOpen(false);
            setEditingInventoryItem(undefined);
            setIsCategoryManagerOpen(true);
          }}
        />
      )}
      {isProgramOpen && (
        <ProgramModal
          onSubmit={handleSaveProgram}
          onClose={() => setIsProgramOpen(false)}
        />
      )}
      {isPoskoNeedOpen && (
        <PoskoNeedModal
          editNeed={editingPoskoNeed}
          onSubmit={handleSavePoskoNeed}
          onClose={() => { setIsPoskoNeedOpen(false); setEditingPoskoNeed(undefined); }}
        />
      )}
      {isProgramNeedOpen && addNeedForProgramId && (
        <ProgramNeedModal
          programId={addNeedForProgramId}
          onSubmit={handleSaveProgramNeed}
          onClose={() => { setIsProgramNeedOpen(false); setAddNeedForProgramId(null); }}
        />
      )}
      {isReturnOpen && returningBorrowingId && (
        <ReturnModal
          borrowingId={returningBorrowingId}
          onSubmit={handleReturnBorrowing}
          onClose={() => { setIsReturnOpen(false); setReturningBorrowingId(null); }}
        />
      )}
      {isCategoryManagerOpen && (
        <CategoryManagerModal
          categories={categories}
          itemCounts={itemCountsByCategoryId}
          onAdd={handleAddCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setIsCategoryManagerOpen(false)}
        />
      )}
      {isDivisionManagerOpen && (
        <DivisionManagerModal
          divisions={divisions}
          procCounts={procCountsByDivisionId}
          onAdd={handleAddDivision}
          onUpdate={handleUpdateDivision}
          onDelete={handleDeleteDivision}
          onClose={() => setIsDivisionManagerOpen(false)}
        />
      )}
    </div>
  );
}
