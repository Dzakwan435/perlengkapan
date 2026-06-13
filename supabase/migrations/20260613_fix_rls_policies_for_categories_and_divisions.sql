-- =========================================================
-- FIX: RLS policy divisions & inventory_categories
-- =========================================================
-- Aplikasi saat ini mengakses tabel dengan anon key (tanpa login),
-- sehingga policy `TO authenticated` menolak INSERT/UPDATE/DELETE.
-- Migration ini mengganti policy agar mengizinkan akses penuh bagi
-- anon + authenticated (role public) sambil tetap mempertahankan
-- RLS aktif.
-- =========================================================

-- -----------------------------------------
-- inventory_categories
-- -----------------------------------------
DROP POLICY IF EXISTS "Authenticated users full access inventory categories"
    ON public.inventory_categories;
DROP POLICY IF EXISTS "Public full access inventory categories"
    ON public.inventory_categories;

CREATE POLICY "Public full access inventory categories"
    ON public.inventory_categories
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------
-- divisions
-- -----------------------------------------
DROP POLICY IF EXISTS "Authenticated users full access divisions"
    ON public.divisions;
DROP POLICY IF EXISTS "Public full access divisions"
    ON public.divisions;

CREATE POLICY "Public full access divisions"
    ON public.divisions
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
