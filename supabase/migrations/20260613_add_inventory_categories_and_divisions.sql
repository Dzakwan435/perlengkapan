-- =========================================================
-- MIGRATION: Master Kategori Inventaris & Divisi Pengadaan
-- =========================================================
-- Menambahkan tabel master inventory_categories dan divisions,
-- lalu memindahkan kolom text (category, division) ke foreign key.
-- Kolom lama dipertahankan sementara sebagai arsip.
-- =========================================================

-- =========================================
-- 1. MASTER KATEGORI INVENTARIS
-- =========================================
CREATE TABLE IF NOT EXISTS public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.inventory_categories (name)
VALUES
    ('Elektronik'),
    ('Perkakas'),
    ('Kebersihan'),
    ('Kesehatan')
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- 2. MASTER DIVISI
-- =========================================
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.divisions (name)
VALUES
    ('Acara'),
    ('BPH'),
    ('Perlengkapan'),
    ('PDD'),
    ('Humas')
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- 3. RELASI INVENTORY_ITEMS -> KATEGORI
-- =========================================
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS category_id UUID
    REFERENCES public.inventory_categories(id) ON DELETE SET NULL;

-- Backfill berdasarkan kolom `category` (text) yang lama
UPDATE public.inventory_items AS i
SET category_id = c.id
FROM public.inventory_categories AS c
WHERE i.category_id IS NULL
  AND NULLIF(TRIM(i.category), '') IS NOT NULL
  AND LOWER(TRIM(i.category)) = LOWER(TRIM(c.name));

-- Jika ada barang lama yang kategorinya tidak cocok dengan master,
-- masukkan sebagai kategori baru secara otomatis.
DO $$
DECLARE
    r RECORD;
    new_cat_id UUID;
BEGIN
    FOR r IN
        SELECT DISTINCT i.category
        FROM public.inventory_items i
        WHERE i.category_id IS NULL
          AND NULLIF(TRIM(i.category), '') IS NOT NULL
    LOOP
        INSERT INTO public.inventory_categories (name)
        VALUES (r.category)
        ON CONFLICT (name) DO NOTHING
        RETURNING id INTO new_cat_id;

        IF new_cat_id IS NULL THEN
            SELECT id INTO new_cat_id
            FROM public.inventory_categories
            WHERE LOWER(name) = LOWER(TRIM(r.category))
            LIMIT 1;
        END IF;

        UPDATE public.inventory_items
        SET category_id = new_cat_id
        WHERE category IS NOT DISTINCT FROM r.category
          AND category_id IS NULL;
    END LOOP;
END $$;

-- =========================================
-- 4. RELASI PROCUREMENTS -> DIVISI
-- =========================================
ALTER TABLE public.procurements
ADD COLUMN IF NOT EXISTS division_id UUID
    REFERENCES public.divisions(id) ON DELETE SET NULL;

-- Backfill berdasarkan kolom `division` (text) jika sudah ada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'procurements'
          AND column_name = 'division'
    ) THEN
        EXECUTE $sql$
            UPDATE public.procurements AS p
            SET division_id = d.id
            FROM public.divisions AS d
            WHERE p.division_id IS NULL
              AND NULLIF(TRIM(p.division), '') IS NOT NULL
              AND LOWER(TRIM(p.division)) = LOWER(TRIM(d.name));
        $sql$;
    END IF;
END $$;

-- =========================================
-- 5. INDEX
-- =========================================
CREATE INDEX IF NOT EXISTS idx_inventory_category
    ON public.inventory_items(category_id);

CREATE INDEX IF NOT EXISTS idx_procurement_division
    ON public.procurements(division_id);

-- =========================================
-- 6. ROW LEVEL SECURITY
-- =========================================
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 7. POLICIES
-- =========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'inventory_categories'
          AND policyname = 'Public full access inventory categories'
    ) THEN
        CREATE POLICY "Public full access inventory categories"
            ON public.inventory_categories
            FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'divisions'
          AND policyname = 'Public full access divisions'
    ) THEN
        CREATE POLICY "Public full access divisions"
            ON public.divisions
            FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- =========================================
-- 8. (OPSIONAL) BERSIHKAN KOLOM LAMA
-- =========================================
-- Jalankan blok di bawah INI HANYA SETELAH aplikasi frontend
-- sepenuhnya menggunakan category_id / division_id dan data
-- sudah ter-migrasi dengan benar.
--
-- ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS category;
-- ALTER TABLE public.procurements   DROP COLUMN IF EXISTS division;
