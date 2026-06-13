-- =========================================================
-- MIGRATION: Tambah procurement_type pada procurements
-- =========================================================
-- Membedakan pengadaan barang habis pakai (diarahkan ke
-- posko_needs) dengan barang berulang (diarahkan ke
-- inventory_items) saat pengadaan disetujui.
--
-- Nilai:
--   'inventaris' -> barang berulang, masuk inventaris
--   'posko'      -> barang habis pakai, masuk kebutuhan posko
-- =========================================================

ALTER TABLE public.procurements
ADD COLUMN IF NOT EXISTS procurement_type VARCHAR(20) DEFAULT 'inventaris';

-- Backfill: pengadaan lama diasumsikan tipe inventaris.
UPDATE public.procurements
SET procurement_type = 'inventaris'
WHERE procurement_type IS NULL;

-- Index agar filter per tipe cepat
CREATE INDEX IF NOT EXISTS idx_procurement_type
    ON public.procurements(procurement_type);

-- Constraint ringan agar hanya nilai yang diizinkan yang masuk
ALTER TABLE public.procurements
ADD CONSTRAINT chk_procurement_type
CHECK (procurement_type IN ('inventaris', 'posko'));
