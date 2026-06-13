-- =========================================================
-- MIGRATION: Tambah category_id pada procurements
-- =========================================================
-- Memungkinkan user memilih kategori inventaris tujuan saat
-- lapor pengadaan. Saat pengadaan disetujui, barang otomatis
-- masuk ke kategori tersebut.
-- =========================================================

ALTER TABLE public.procurements
ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES public.inventory_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_procurement_category
    ON public.procurements(category_id);
