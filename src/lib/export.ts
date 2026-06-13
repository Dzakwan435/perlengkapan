import type {
  InventoryItem,
  InventoryCategory,
  Program,
  ProgramNeed,
  PoskoNeed,
  Procurement,
  Division,
} from '../types';
import { resolveCategoryName, resolveDivisionName, resolveProcurementCategoryName } from './supabase';

// ============================================================
// CSV Helper
// ============================================================
function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// PDF Helper (Dynamic Import)
// ============================================================
async function loadPDFLibs() {
  const jsPDFModule = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  return {
    jsPDF: jsPDFModule.default,
    autoTable: autoTableModule.default,
  };
}

async function createPDF(title: string) {
  const { jsPDF } = await loadPDFLibs();
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 22);
  return doc;
}

function savePDF(doc: any, filename: string) {
  doc.save(`${filename}.pdf`);
}

// Helper: aman menambahkan autoTable section baru di bawah yang sebelumnya
function nextStartY(doc: any, gap = 6): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const last = (doc as any).lastAutoTable?.finalY ?? 28;
  return last + gap;
}

// ============================================================
// INVENTORY
// ============================================================
export function exportInventoryCSV(
  items: InventoryItem[],
  categories: InventoryCategory[] = [],
  title: string = 'inventaris'
) {
  const headers = ['Kategori', 'Nama Barang', 'Jumlah', 'Kondisi', 'Lokasi'];
  const rows = [...items]
    .sort((a, b) => {
      const ca = resolveCategoryName(a);
      const cb = resolveCategoryName(b);
      return ca.localeCompare(cb) || a.item_name.localeCompare(b.item_name);
    })
    .map(i => [
      resolveCategoryName(i),
      i.item_name,
      String(i.quantity),
      i.condition,
      i.storage_location,
    ]);
  downloadCSV(title, headers, rows);
}

// PDF inventaris dikelompokkan per kategori dengan subtotal jumlah unit.
export async function exportInventoryPDF(
  items: InventoryItem[],
  categories: InventoryCategory[] = [],
  title: string = 'Data Inventaris'
) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF(title);

  // Kelompokkan item per kategori
  const groups = new Map<string, InventoryItem[]>();
  const groupNameById = new Map<string, string>();
  categories.forEach(c => groupNameById.set(c.id, c.name));

  const uncategorized: InventoryItem[] = [];
  items.forEach(item => {
    if (item.category_id && groupNameById.has(item.category_id)) {
      const arr = groups.get(item.category_id) ?? [];
      arr.push(item);
      groups.set(item.category_id, arr);
    } else if (item.category_id) {
      // id ada tapi tidak dikenal (seharusnya tidak terjadi)
      const arr = groups.get(item.category_id) ?? [];
      arr.push(item);
      groups.set(item.category_id, arr);
    } else {
      uncategorized.push(item);
    }
  });

  let startY = 28;
  let grandQty = 0;
  let grandTypes = 0;

  // Urutan kategori: sesuai urutan master, baru "Tanpa Kategori" di akhir.
  const orderedCategoryIds = [
    ...categories.map(c => c.id),
    ...Array.from(groups.keys()).filter(id => !categories.some(c => c.id === id)),
  ];

  for (const catId of orderedCategoryIds) {
    const list = groups.get(catId);
    if (!list || list.length === 0) continue;
    const catName = groupNameById.get(catId) ?? 'Kategori Tidak Dikenal';
    const subtotalQty = list.reduce((s, i) => s + i.quantity, 0);
    grandQty += subtotalQty;
    grandTypes += list.length;

    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(`Kategori: ${catName}`, 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Nama Barang', 'Jumlah', 'Kondisi', 'Lokasi']],
      body: list.map(i => [
        i.item_name,
        String(i.quantity),
        i.condition,
        i.storage_location,
      ]),
      foot: [[{ content: `Subtotal ${catName}`, styles: { fontStyle: 'bold' } }, String(subtotalQty), '', '']],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59] },
    });

    startY = nextStartY(doc, 8);
  }

  // Tanpa kategori
  if (uncategorized.length > 0) {
    const subtotalQty = uncategorized.reduce((s, i) => s + i.quantity, 0);
    grandQty += subtotalQty;
    grandTypes += uncategorized.length;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Tanpa Kategori', 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Nama Barang', 'Jumlah', 'Kondisi', 'Lokasi']],
      body: uncategorized.map(i => [
        i.item_name,
        String(i.quantity),
        i.condition,
        i.storage_location,
      ]),
      foot: [[{ content: 'Subtotal Tanpa Kategori', styles: { fontStyle: 'bold' } }, String(subtotalQty), '', '']],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 116, 139] },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59] },
    });
    startY = nextStartY(doc, 8);
  }

  // Grand total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Grand Total: ${grandTypes} jenis barang, ${grandQty} unit`,
    14,
    startY + 2
  );
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const fileSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  savePDF(doc, fileSlug || 'inventaris');
}

// ============================================================
// PROGRAMS
// ============================================================
export function exportProgramsCSV(programs: Program[], programNeeds: ProgramNeed[]) {
  const headers = ['Nama Program', 'Deskripsi', 'Tanggal', 'Kebutuhan Barang'];
  const rows = programs.map(p => {
    const needs = programNeeds
      .filter(pn => pn.program_id === p.id)
      .map(pn => `${pn.item_name} (${pn.quantity})`)
      .join('; ');
    return [
      p.name,
      p.description ?? '',
      p.event_date,
      needs,
    ];
  });
  downloadCSV('program_kerja', headers, rows);
}

export async function exportProgramsPDF(programs: Program[], programNeeds: ProgramNeed[]) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF('Data Program Kerja');
  autoTable(doc, {
    startY: 28,
    head: [['Nama Program', 'Deskripsi', 'Tanggal', 'Kebutuhan Barang']],
    body: programs.map(p => {
      const needs = programNeeds
        .filter(pn => pn.program_id === p.id)
        .map(pn => `${pn.item_name} (${pn.quantity})`)
        .join('\n');
      return [
        p.name,
        p.description ?? '',
        p.event_date,
        needs,
      ];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: { 3: { cellWidth: 60 } },
  });
  savePDF(doc, 'program_kerja');
}

// ============================================================
// POSKO NEEDS
// ============================================================
export function exportPoskoNeedsCSV(needs: PoskoNeed[]) {
  const headers = ['Nama Item', 'Jumlah', 'Status', 'Catatan'];
  const rows = needs.map(n => [
    n.item_name,
    String(n.quantity),
    n.status,
    n.notes ?? '',
  ]);
  downloadCSV('kebutuhan_posko', headers, rows);
}

export async function exportPoskoNeedsPDF(needs: PoskoNeed[]) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF('Data Kebutuhan Posko');
  autoTable(doc, {
    startY: 28,
    head: [['Nama Item', 'Jumlah', 'Status', 'Catatan']],
    body: needs.map(n => [
      n.item_name,
      String(n.quantity),
      n.status,
      n.notes ?? '',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  savePDF(doc, 'kebutuhan_posko');
}

// ============================================================
// PROCUREMENTS
// ============================================================
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

const typeLabel = (t?: string) =>
  t === 'posko' ? 'Habis Pakai' : t === 'inventaris' ? 'Inventaris' : '-';

export function exportProcurementsCSV(
  procs: Procurement[],
  divisions: Division[] = [],
  title: string = 'pengadaan'
) {
  const headers = ['Tipe', 'Divisi', 'Kategori Tujuan', 'Nama Barang', 'Jumlah', 'Harga Satuan', 'Total', 'Alasan', 'Status'];
  const rows = [...procs]
    .sort((a, b) => {
      const da = resolveDivisionName(a) ?? 'ZZZZ';
      const db = resolveDivisionName(b) ?? 'ZZZZ';
      return da.localeCompare(db);
    })
    .map(p => [
      typeLabel(p.procurement_type),
      resolveDivisionName(p) ?? '(Tanpa Divisi)',
      resolveProcurementCategoryName(p) ?? '(Tanpa Kategori)',
      p.item_name,
      String(p.quantity),
      `Rp ${fmtIDR(p.estimated_price)}`,
      `Rp ${fmtIDR(p.estimated_price * p.quantity)}`,
      p.reason ?? '',
      p.status,
    ]);
  downloadCSV(title, headers, rows);
}

// PDF pengadaan dikelompokkan per divisi dengan subtotal nominal + Grand Total.
export async function exportProcurementsPDF(
  procs: Procurement[],
  divisions: Division[] = [],
  title: string = 'Data Pengadaan Barang'
) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF(title);

  const groups = new Map<string, Procurement[]>();
  const groupNameById = new Map<string, string>();
  divisions.forEach(d => groupNameById.set(d.id, d.name));

  const noDivision: Procurement[] = [];
  procs.forEach(p => {
    if (p.division_id) {
      const arr = groups.get(p.division_id) ?? [];
      arr.push(p);
      groups.set(p.division_id, arr);
    } else {
      noDivision.push(p);
    }
  });

  let startY = 28;
  let grandTotal = 0;
  let grandCount = 0;

  const orderedDivisionIds = [
    ...divisions.map(d => d.id),
    ...Array.from(groups.keys()).filter(id => !divisions.some(d => d.id === id)),
  ];

  for (const divId of orderedDivisionIds) {
    const list = groups.get(divId);
    if (!list || list.length === 0) continue;
    const divName = groupNameById.get(divId) ?? 'Divisi Tidak Dikenal';
    const subtotal = list.reduce((s, p) => s + p.estimated_price * p.quantity, 0);
    grandTotal += subtotal;
    grandCount += list.length;

    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text(`Divisi: ${divName}`, 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Tipe', 'Kategori Tujuan', 'Nama Barang', 'Qty', 'Harga Satuan', 'Total', 'Status']],
      body: list.map(p => [
        typeLabel(p.procurement_type),
        resolveProcurementCategoryName(p) ?? '-',
        p.item_name,
        String(p.quantity),
        `Rp ${fmtIDR(p.estimated_price)}`,
        `Rp ${fmtIDR(p.estimated_price * p.quantity)}`,
        p.status,
      ]),
      foot: [[
        { content: `Total Divisi ${divName}`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
        `Rp ${fmtIDR(subtotal)}`,
        '',
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [5, 150, 105] },
      footStyles: { fillColor: [236, 253, 245], textColor: [6, 95, 70] },
    });

    startY = nextStartY(doc, 8);
  }

  // Tanpa Divisi
  if (noDivision.length > 0) {
    const subtotal = noDivision.reduce((s, p) => s + p.estimated_price * p.quantity, 0);
    grandTotal += subtotal;
    grandCount += noDivision.length;

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Tanpa Divisi', 14, startY);
    doc.setTextColor(0, 0, 0);
    startY += 3;

    autoTable(doc, {
      startY,
      head: [['Tipe', 'Kategori Tujuan', 'Nama Barang', 'Qty', 'Harga Satuan', 'Total', 'Status']],
      body: noDivision.map(p => [
        typeLabel(p.procurement_type),
        resolveProcurementCategoryName(p) ?? '-',
        p.item_name,
        String(p.quantity),
        `Rp ${fmtIDR(p.estimated_price)}`,
        `Rp ${fmtIDR(p.estimated_price * p.quantity)}`,
        p.status,
      ]),
      foot: [[
        { content: 'Total Tanpa Divisi', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } },
        `Rp ${fmtIDR(subtotal)}`,
        '',
      ]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 116, 139] },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59] },
    });
    startY = nextStartY(doc, 8);
  }

  // Grand Total
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Grand Total: ${grandCount} item · Rp ${fmtIDR(grandTotal)}`,
    14,
    startY + 2
  );
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const fileSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  savePDF(doc, fileSlug || 'pengadaan');
}
