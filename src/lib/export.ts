import type {
  InventoryItem,
  Program,
  ProgramNeed,
  PoskoNeed,
  Procurement,
} from '../types';

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

// ============================================================
// INVENTORY
// ============================================================
export function exportInventoryCSV(items: InventoryItem[]) {
  const headers = ['Nama Barang', 'Kategori', 'Jumlah', 'Kondisi', 'Lokasi'];
  const rows = items.map(i => [
    i.item_name,
    i.category,
    String(i.quantity),
    i.condition,
    i.storage_location,
  ]);
  downloadCSV('inventaris', headers, rows);
}

export async function exportInventoryPDF(items: InventoryItem[]) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF('Data Inventaris');
  autoTable(doc, {
    startY: 28,
    head: [['Nama Barang', 'Kategori', 'Jumlah', 'Kondisi', 'Lokasi']],
    body: items.map(i => [
      i.item_name,
      i.category,
      String(i.quantity),
      i.condition,
      i.storage_location,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  savePDF(doc, 'inventaris');
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
export function exportProcurementsCSV(procs: Procurement[]) {
  const headers = ['Nama Barang', 'Jumlah', 'Harga Satuan', 'Total', 'Alasan', 'Status'];
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const rows = procs.map(p => [
    p.item_name,
    String(p.quantity),
    `Rp ${fmt(p.estimated_price)}`,
    `Rp ${fmt(p.estimated_price * p.quantity)}`,
    p.reason ?? '',
    p.status,
  ]);
  downloadCSV('pengadaan', headers, rows);
}

export async function exportProcurementsPDF(procs: Procurement[]) {
  const { autoTable } = await loadPDFLibs();
  const doc = await createPDF('Data Pengadaan Barang');
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  autoTable(doc, {
    startY: 28,
    head: [['Nama Barang', 'Jumlah', 'Harga Satuan', 'Total', 'Alasan', 'Status']],
    body: procs.map(p => [
      p.item_name,
      String(p.quantity),
      `Rp ${fmt(p.estimated_price)}`,
      `Rp ${fmt(p.estimated_price * p.quantity)}`,
      p.reason ?? '',
      p.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  savePDF(doc, 'pengadaan');
}
