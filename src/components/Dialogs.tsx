'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  InventoryItem,
  InventoryCategory,
  Program,
  PoskoNeed,
  Procurement,
  ProcurementType,
  Division,
} from '../types';

// ============================================================
// Shared modal shell
// ============================================================
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 z-10">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white';

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

function NumericInput({
  value,
  onChange,
  min = 0,
  className,
  placeholder,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  className?: string;
  placeholder?: string;
}) {
  const [raw, setRaw] = React.useState(value === 0 ? '' : String(value));

  React.useEffect(() => {
    setRaw(value === 0 ? '' : String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className ?? inputCls}
      placeholder={placeholder ?? '0'}
      value={raw}
      onChange={e => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        if (v.length > 1 && v.startsWith('0')) {
          setRaw(raw);
          return;
        }
        setRaw(v);
        onChange(v === '' ? 0 : Math.max(min, parseInt(v, 10)));
      }}
      onBlur={() => {
        if (raw === '' || raw === '0') {
          setRaw(min > 0 ? String(min) : '');
          onChange(min > 0 ? min : 0);
        }
      }}
    />
  );
}

// ============================================================
// BorrowModal
// ============================================================
interface BorrowModalProps {
  inventory: InventoryItem[];
  programs: Program[];
  onSubmit: (data: {
    program_id: string | null;
    borrow_date: string;
    details: { inventory_id: string; quantity: number }[];
  }) => void;
  onClose: () => void;
}

interface BorrowDetail {
  inventory_id: string;
  quantity: number;
}

export function BorrowModal({ inventory, programs, onSubmit, onClose }: BorrowModalProps) {
  const [programId, setProgramId] = useState<string>('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState<BorrowDetail[]>([{ inventory_id: '', quantity: 1 }]);

  const addDetail = () => setDetails(prev => [...prev, { inventory_id: '', quantity: 1 }]);
  const removeDetail = (i: number) => setDetails(prev => prev.filter((_, idx) => idx !== i));
  const updateDetail = (i: number, field: keyof BorrowDetail, value: string | number) =>
    setDetails(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));

  const valid =
    borrowDate &&
    details.length > 0 &&
    details.every(d => d.inventory_id && d.quantity > 0);

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({
      program_id: programId || null,
      borrow_date: borrowDate,
      details: details.map(d => ({ inventory_id: d.inventory_id, quantity: Number(d.quantity) })),
    });
  };

  return (
    <ModalShell title="Pinjam Barang" onClose={onClose}>
      <Field label="Untuk Program Kerja (opsional)">
        <select
          className={inputCls}
          value={programId}
          onChange={e => setProgramId(e.target.value)}
        >
          <option value="">-- Pilih program (opsional) --</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Tanggal Pinjam">
        <input
          type="date"
          className={inputCls}
          value={borrowDate}
          onChange={e => setBorrowDate(e.target.value)}
        />
      </Field>

      <Field label="Barang yang Dipinjam">
        <div className="space-y-2">
          {details.map((d, i) => (
            <div key={i} className="flex gap-2">
              <select
                className={`${inputCls} flex-1`}
                value={d.inventory_id}
                onChange={e => updateDetail(i, 'inventory_id', e.target.value)}
              >
                <option value="">-- Pilih barang --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} ({item.quantity} tersedia)
                  </option>
                ))}
              </select>
              <NumericInput
                min={1}
                className={`${inputCls} w-20`}
                value={d.quantity}
                onChange={val => updateDetail(i, 'quantity', val)}
              />
              {details.length > 1 && (
                <button
                  onClick={() => removeDetail(i)}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addDetail}
            className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-xs font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Tambah barang
          </button>
        </div>
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Catat Peminjaman
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// ReturnModal
// ============================================================
interface ReturnModalProps {
  borrowingId: string;
  onSubmit: (data: {
    borrowing_id: string;
    return_date: string;
    item_condition: 'Baik' | 'Rusak' | 'Hilang';
    notes: string;
  }) => void;
  onClose: () => void;
}

export function ReturnModal({ borrowingId, onSubmit, onClose }: ReturnModalProps) {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState<'Baik' | 'Rusak' | 'Hilang'>('Baik');
  const [notes, setNotes] = useState('');

  return (
    <ModalShell title="Kembalikan Barang" onClose={onClose}>
      <Field label="Tanggal Kembali">
        <input
          type="date"
          className={inputCls}
          value={returnDate}
          onChange={e => setReturnDate(e.target.value)}
        />
      </Field>

      <Field label="Kondisi Barang">
        <select
          className={inputCls}
          value={condition}
          onChange={e => setCondition(e.target.value as 'Baik' | 'Rusak' | 'Hilang')}
        >
          <option value="Baik">Baik</option>
          <option value="Rusak">Rusak</option>
          <option value="Hilang">Hilang</option>
        </select>
      </Field>

      <Field label="Catatan (opsional)">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Kondisi khusus, kerusakan, dll."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() =>
            onSubmit({ borrowing_id: borrowingId, return_date: returnDate, item_condition: condition, notes })
          }
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Konfirmasi Kembali
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// ProcurementModal
// ============================================================
interface ProcurementModalProps {
  editProc?: Procurement;
  divisions: Division[];
  categories: InventoryCategory[];
  onSubmit: (data: Omit<Procurement, 'id' | 'status' | 'created_at' | 'divisions' | 'categories'>) => void;
  onClose: () => void;
  onOpenDivisionManager?: () => void;
  onOpenCategoryManager?: () => void;
}

export function ProcurementModal({
  editProc,
  divisions,
  categories,
  onSubmit,
  onClose,
  onOpenDivisionManager,
  onOpenCategoryManager,
}: ProcurementModalProps) {
  const [itemName, setItemName] = useState(editProc?.item_name ?? '');
  const [quantity, setQuantity] = useState(editProc?.quantity ?? 1);
  const [price, setPrice] = useState(editProc?.estimated_price ?? 0);
  const [reason, setReason] = useState(editProc?.reason ?? '');
  const [divisionId, setDivisionId] = useState<string>(editProc?.division_id ?? '');
  const [categoryId, setCategoryId] = useState<string>(editProc?.category_id ?? '');
  const [procurementType, setProcurementType] = useState<ProcurementType>(
    editProc?.procurement_type ?? 'inventaris'
  );

  const valid = itemName.trim() && quantity > 0;

  // Saat tipe berubah ke 'posko', kategori inventaris tidak relevan → reset.
  const handleTypeChange = (t: ProcurementType) => {
    setProcurementType(t);
    if (t === 'posko') setCategoryId('');
  };

  return (
    <ModalShell title={editProc ? 'Edit Pengadaan' : 'Lapor Pengadaan'} onClose={onClose}>
      <Field label="Tipe Barang">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('inventaris')}
            className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
              procurementType === 'inventaris'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-semibold">Barang Berulang</div>
            <div className={`text-[10px] mt-0.5 font-normal ${
              procurementType === 'inventaris' ? 'text-blue-100' : 'text-slate-400'
            }`}>
              Masuk ke Inventaris
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('posko')}
            className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
              procurementType === 'posko'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-sm font-semibold">Habis Pakai</div>
            <div className={`text-[10px] mt-0.5 font-normal ${
              procurementType === 'posko' ? 'text-rose-100' : 'text-slate-400'
            }`}>
              Masuk ke Kebutuhan Posko
            </div>
          </button>
        </div>
      </Field>

      <Field label="Divisi Pemohon">
        <select
          className={inputCls}
          value={divisionId}
          onChange={e => setDivisionId(e.target.value)}
        >
          <option value="">-- Pilih divisi (opsional) --</option>
          {divisions.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {onOpenDivisionManager && (
          <button
            type="button"
            onClick={onOpenDivisionManager}
            className="mt-1.5 text-xs text-blue-600 font-medium hover:text-blue-700"
          >
            + Kelola daftar divisi
          </button>
        )}
      </Field>

      {procurementType === 'inventaris' && (
        <Field label="Kategori Inventaris Tujuan">
          <select
            className={inputCls}
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">-- Pilih kategori tujuan saat disetujui (opsional) --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Barang akan otomatis masuk ke kategori ini saat pengadaan disetujui.
          </p>
          {onOpenCategoryManager && (
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="mt-1.5 text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              + Kelola daftar kategori
            </button>
          )}
        </Field>
      )}

      {procurementType === 'posko' && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
          Barang habis pakai akan ditambahkan ke daftar <b>Kebutuhan Posko</b> dengan status
          <i> Belum Dibeli</i> saat pengadaan disetujui.
        </div>
      )}

      <Field label="Nama Barang">
        <input
          type="text"
          className={inputCls}
          placeholder={
            procurementType === 'posko'
              ? 'Contoh: Air Galon, Gas LPG, Tisu'
              : 'Nama barang yang dibutuhkan'
          }
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </Field>

      <Field label="Jumlah">
        <NumericInput
          min={1}
          className={inputCls}
          value={quantity}
          onChange={val => setQuantity(val)}
        />
      </Field>

      <Field label="Estimasi Harga Satuan (Rp)">
        <NumericInput
          min={0}
          className={inputCls}
          placeholder="0"
          value={price}
          onChange={val => setPrice(val)}
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Ditampilkan: <span className="font-semibold text-slate-600">{fmt(price)}</span>
        </p>
      </Field>

      <Field label="Alasan / Keperluan">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Jelaskan mengapa barang ini diperlukan"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() =>
            onSubmit({
              item_name: itemName.trim(),
              quantity,
              estimated_price: price,
              reason: reason.trim(),
              division_id: divisionId || null,
              category_id: procurementType === 'inventaris' ? (categoryId || null) : null,
              procurement_type: procurementType,
            })
          }
          disabled={!valid}
          className={`flex-1 py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors ${
            procurementType === 'posko'
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {editProc ? 'Simpan Perubahan' : 'Kirim Laporan'}
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// InventoryItemModal
// ============================================================
interface InventoryItemModalProps {
  editItem?: InventoryItem;
  categories: InventoryCategory[];
  onSubmit: (data: Omit<InventoryItem, 'id' | 'created_at' | 'categories'>) => void;
  onClose: () => void;
  onOpenCategoryManager?: () => void;
}

export function InventoryItemModal({
  editItem,
  categories,
  onSubmit,
  onClose,
  onOpenCategoryManager,
}: InventoryItemModalProps) {
  // Resolusi awal: pakai category_id, fallback ke kategori dengan nama yang sama
  const initialCategoryId = useMemo(() => {
    if (editItem?.category_id) return editItem.category_id;
    if (editItem?.category) {
      const match = categories.find(
        c => c.name.toLowerCase() === editItem.category?.toLowerCase()
      );
      return match?.id ?? '';
    }
    return categories[0]?.id ?? '';
  }, [editItem, categories]);

  const [itemName, setItemName] = useState(editItem?.item_name ?? '');
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [quantity, setQuantity] = useState(editItem?.quantity ?? 1);
  const [condition, setCondition] = useState<InventoryItem['condition']>(editItem?.condition ?? 'Baik');
  const [location, setLocation] = useState(editItem?.storage_location ?? 'Gudang Posko');

  useEffect(() => {
    setCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  const valid = itemName.trim() && quantity >= 0;

  return (
    <ModalShell title={editItem ? 'Edit Barang' : 'Tambah Barang'} onClose={onClose}>
      <Field label="Nama Barang">
        <input
          type="text"
          className={inputCls}
          placeholder="Nama barang"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </Field>

      <Field label="Kategori">
        <select
          className={inputCls}
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          {categories.length === 0 && <option value="">-- Belum ada kategori --</option>}
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {onOpenCategoryManager && (
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="mt-1.5 text-xs text-blue-600 font-medium hover:text-blue-700"
          >
            + Kelola daftar kategori
          </button>
        )}
      </Field>

      <Field label="Kondisi">
        <select
          className={inputCls}
          value={condition}
          onChange={e => setCondition(e.target.value as InventoryItem['condition'])}
        >
          <option value="Baik">Baik</option>
          <option value="Rusak">Rusak</option>
          <option value="Hilang">Hilang</option>
        </select>
      </Field>

      <Field label="Jumlah">
        <NumericInput
          min={0}
          className={inputCls}
          value={quantity}
          onChange={val => setQuantity(val)}
        />
      </Field>

      <Field label="Lokasi Penyimpanan">
        <input
          type="text"
          className={inputCls}
          placeholder="Gudang Posko, Balai Desa, dll."
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() =>
            onSubmit({
              item_name: itemName.trim(),
              category: categories.find(c => c.id === categoryId)?.name ?? null,
              category_id: categoryId || null,
              quantity,
              condition,
              storage_location: location.trim(),
            })
          }
          disabled={!valid}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {editItem ? 'Simpan Perubahan' : 'Tambah Barang'}
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// ProgramModal
// ============================================================
interface ProgramModalProps {
  onSubmit: (data: { name: string; description: string; event_date: string }) => void;
  onClose: () => void;
}

export function ProgramModal({ onSubmit, onClose }: ProgramModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const valid = name.trim() && eventDate;

  return (
    <ModalShell title="Tambah Program Kerja" onClose={onClose}>
      <Field label="Nama Program">
        <input
          type="text"
          className={inputCls}
          placeholder="Nama program kerja"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </Field>

      <Field label="Deskripsi (opsional)">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          placeholder="Tujuan atau deskripsi singkat program"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </Field>

      <Field label="Tanggal Kegiatan">
        <input
          type="date"
          className={inputCls}
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => onSubmit({ name: name.trim(), description: description.trim(), event_date: eventDate })}
          disabled={!valid}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Tambah Program
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// PoskoNeedModal
// ============================================================
interface PoskoNeedModalProps {
  editNeed?: PoskoNeed;
  onSubmit: (data: Omit<PoskoNeed, 'id' | 'created_at'>) => void;
  onClose: () => void;
}

export function PoskoNeedModal({ editNeed, onSubmit, onClose }: PoskoNeedModalProps) {
  const [itemName, setItemName] = useState(editNeed?.item_name ?? '');
  const [quantity, setQuantity] = useState(editNeed?.quantity ?? 1);
  const [status, setStatus] = useState<PoskoNeed['status']>(editNeed?.status ?? 'Belum Dibeli');
  const [notes, setNotes] = useState(editNeed?.notes ?? '');

  const valid = itemName.trim() && quantity > 0;

  return (
    <ModalShell title={editNeed ? 'Edit Kebutuhan' : 'Tambah Kebutuhan Posko'} onClose={onClose}>
      <Field label="Nama Item">
        <input
          type="text"
          className={inputCls}
          placeholder="Air galon, gas LPG, dll."
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </Field>

      <Field label="Jumlah">
        <NumericInput
          min={1}
          className={inputCls}
          value={quantity}
          onChange={val => setQuantity(val)}
        />
      </Field>

      <Field label="Status">
        <select
          className={inputCls}
          value={status}
          onChange={e => setStatus(e.target.value as PoskoNeed['status'])}
        >
          <option value="Belum Dibeli">Belum Dibeli</option>
          <option value="Sudah Dibeli">Sudah Dibeli</option>
        </select>
      </Field>

      <Field label="Catatan (opsional)">
        <input
          type="text"
          className={inputCls}
          placeholder="Merek tertentu, prioritas, dll."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() =>
            onSubmit({ item_name: itemName.trim(), quantity, status, notes: notes.trim() })
          }
          disabled={!valid}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {editNeed ? 'Simpan' : 'Tambah'}
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// ProgramNeedModal
// ============================================================
interface ProgramNeedModalProps {
  programId: string;
  onSubmit: (data: { program_id: string; item_name: string; quantity: number }) => void;
  onClose: () => void;
}

export function ProgramNeedModal({ programId, onSubmit, onClose }: ProgramNeedModalProps) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const valid = itemName.trim() && quantity > 0;

  return (
    <ModalShell title="Tambah Kebutuhan Proker" onClose={onClose}>
      <Field label="Nama Barang">
        <input
          type="text"
          className={inputCls}
          placeholder="Nama barang yang dibutuhkan"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </Field>

      <Field label="Jumlah Dibutuhkan">
        <NumericInput
          min={1}
          className={inputCls}
          value={quantity}
          onChange={val => setQuantity(val)}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => onSubmit({ program_id: programId, item_name: itemName.trim(), quantity })}
          disabled={!valid}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          Tambah
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// CategoryManagerModal (CRUD kategori inventaris)
// ============================================================
interface CategoryManagerModalProps {
  categories: InventoryCategory[];
  itemCounts: Record<string, number>; // jumlah item per category_id
  onAdd: (name: string) => Promise<void> | void;
  onUpdate: (id: string, name: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onClose: () => void;
}

export function CategoryManagerModal({
  categories,
  itemCounts,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: CategoryManagerModalProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onAdd(name);
      setNewName('');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: InventoryCategory) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onUpdate(editingId, name);
      setEditingId(null);
      setEditingName('');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: InventoryCategory) => {
    const used = itemCounts[c.id] ?? 0;
    const msg =
      used > 0
        ? `Kategori "${c.name}" dipakai oleh ${used} barang. Barang-barang tersebut akan kehilangan kategori. Lanjutkan?`
        : `Hapus kategori "${c.name}"?`;
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      await onDelete(c.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Kelola Kategori Inventaris" onClose={onClose}>
      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori</p>
        )}
        {categories.map(c => {
          const isEditing = editingId === c.id;
          const used = itemCounts[c.id] ?? 0;
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100"
            >
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`${inputCls} flex-1`}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    disabled={busy}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={busy}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400">{used} barang</p>
                  </div>
                  <button
                    onClick={() => startEdit(c)}
                    disabled={busy}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={busy}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Field label="Tambah Kategori Baru">
          <div className="flex gap-2">
            <input
              type="text"
              className={`${inputCls} flex-1`}
              placeholder="Nama kategori"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              onClick={handleAdd}
              disabled={busy || !newName.trim()}
              className="flex items-center gap-1.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              <Plus size={14} />
              Tambah
            </button>
          </div>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Selesai
        </button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// DivisionManagerModal (CRUD divisi pengadaan)
// ============================================================
interface DivisionManagerModalProps {
  divisions: Division[];
  procCounts: Record<string, number>; // jumlah pengadaan per division_id
  onAdd: (name: string) => Promise<void> | void;
  onUpdate: (id: string, name: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onClose: () => void;
}

export function DivisionManagerModal({
  divisions,
  procCounts,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: DivisionManagerModalProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onAdd(name);
      setNewName('');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (d: Division) => {
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await onUpdate(editingId, name);
      setEditingId(null);
      setEditingName('');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (d: Division) => {
    const used = procCounts[d.id] ?? 0;
    const msg =
      used > 0
        ? `Divisi "${d.name}" memiliki ${used} pengadaan. Pengadaan tersebut akan kehilangan divisi. Lanjutkan?`
        : `Hapus divisi "${d.name}"?`;
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      await onDelete(d.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Kelola Divisi" onClose={onClose}>
      <div className="space-y-2">
        {divisions.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada divisi</p>
        )}
        {divisions.map(d => {
          const isEditing = editingId === d.id;
          const used = procCounts[d.id] ?? 0;
          return (
            <div
              key={d.id}
              className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100"
            >
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`${inputCls} flex-1`}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    disabled={busy}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={busy}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                    <p className="text-[10px] text-slate-400">{used} pengadaan</p>
                  </div>
                  <button
                    onClick={() => startEdit(d)}
                    disabled={busy}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    disabled={busy}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Field label="Tambah Divisi Baru">
          <div className="flex gap-2">
            <input
              type="text"
              className={`${inputCls} flex-1`}
              placeholder="Nama divisi"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              onClick={handleAdd}
              disabled={busy || !newName.trim()}
              className="flex items-center gap-1.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              <Plus size={14} />
              Tambah
            </button>
          </div>
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Selesai
        </button>
      </div>
    </ModalShell>
  );
}
