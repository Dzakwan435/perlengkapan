'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  InventoryItem,
  Program,
  PoskoNeed,
  Procurement,
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
        // Reject leading zeros unless the input is exactly "0"
        if (v.length > 1 && v.startsWith('0')) {
          setRaw(raw); // keep previous value
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
  onSubmit: (data: Omit<Procurement, 'id' | 'status' | 'created_at'>) => void;
  onClose: () => void;
}

export function ProcurementModal({ editProc, onSubmit, onClose }: ProcurementModalProps) {
  const [itemName, setItemName] = useState(editProc?.item_name ?? '');
  const [quantity, setQuantity] = useState(editProc?.quantity ?? 1);
  const [price, setPrice] = useState(editProc?.estimated_price ?? 0);
  const [reason, setReason] = useState(editProc?.reason ?? '');

  const valid = itemName.trim() && quantity > 0;

  return (
    <ModalShell title={editProc ? 'Edit Pengadaan' : 'Lapor Pengadaan'} onClose={onClose}>
      <Field label="Nama Barang">
        <input
          type="text"
          className={inputCls}
          placeholder="Nama barang yang dibutuhkan"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
        />
      </Field>

      <Field label="Jumlah">
        <input
          type="number"
          min={1}
          className={inputCls}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
        />
      </Field>

      <Field label="Estimasi Harga Satuan (Rp)">
        <input
          type="number"
          min={0}
          step={1000}
          className={inputCls}
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
        />
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
            onSubmit({ item_name: itemName.trim(), quantity, estimated_price: price, reason: reason.trim() })
          }
          disabled={!valid}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
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
const CATEGORIES_OPTIONS = ['Peralatan', 'Elektronik', 'Furnitur', 'Outdoor', 'Audio', 'Kesehatan', 'Aksesoris', 'Lainnya'];

interface InventoryItemModalProps {
  editItem?: InventoryItem;
  onSubmit: (data: Omit<InventoryItem, 'id' | 'created_at'>) => void;
  onClose: () => void;
}

export function InventoryItemModal({ editItem, onSubmit, onClose }: InventoryItemModalProps) {
  const [itemName, setItemName] = useState(editItem?.item_name ?? '');
  const [category, setCategory] = useState(editItem?.category ?? 'Peralatan');
  const [quantity, setQuantity] = useState(editItem?.quantity ?? 1);
  const [condition, setCondition] = useState<InventoryItem['condition']>(editItem?.condition ?? 'Baik');
  const [location, setLocation] = useState(editItem?.storage_location ?? 'Gudang Posko');

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
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES_OPTIONS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
        <input
          type="number"
          min={0}
          className={inputCls}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
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
              category,
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
        <input
          type="number"
          min={1}
          className={inputCls}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
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
        <input
          type="number"
          min={1}
          className={inputCls}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
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
