import * as XLSX from 'xlsx';

const COLUMNS = [
  { key: 'title', label: '사업명' },
  { key: 'bidNo', label: '공고번호' },
  { key: 'orderOrg', label: '발주기관' },
  { key: 'demandOrg', label: '수요기관' },
  { key: 'estimatedPrice', label: '추정가격' },
  { key: 'awardAmount', label: '낙찰금액' },
  { key: 'awardRate', label: '낙찰률' },
  { key: 'bidDeadline', label: '입찰마감' },
  { key: 'openingAt', label: '개찰일시' },
];

function toRows(items) {
  return items.map((it) => {
    const row = {};
    for (const col of COLUMNS) row[col.label] = it[col.key] ?? '';
    return row;
  });
}

// RES-010: CSV 내보내기
export function exportCsv(items, filename = 'nara-search-export.csv') {
  const rows = toRows(items);
  const header = COLUMNS.map((c) => c.label).join(',');
  const body = rows
    .map((r) => COLUMNS.map((c) => `"${String(r[c.label]).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const csv = `﻿${header}\n${body}`; // BOM 포함 (엑셀에서 한글 깨짐 방지)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

// RES-011: Excel 내보내기
export function exportExcel(items, filename = 'nara-search-export.xlsx') {
  const rows = toRows(items);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, '조회결과');
  XLSX.writeFile(wb, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
