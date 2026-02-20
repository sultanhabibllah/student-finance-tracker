import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

let records = [];
let settings = {};

export function init() {
  records = loadRecords();
  settings = loadSettings();
}

export function getRecords() { return records; }
export function getSettings() { return settings; }

export function addRecord(record) {
  records.push(record);
  saveRecords(records);
}

export function updateRecord(id, updates) {
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return false;
  records[idx] = { ...records[idx], ...updates, updatedAt: new Date().toISOString() };
  saveRecords(records);
  return true;
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

export function updateSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  saveSettings(settings);
}

export function generateId() {
  const max = Math.max(0, ...records.map(r => parseInt(r.id.split('_')[1] || '0', 10)));
  return `rec_${String(max + 1).padStart(4, '0')}`;
}

export function sortRecords(recs, sortKey) {
  const sorted = [...recs];
  switch (sortKey) {
    case 'date-desc':  return sorted.sort((a, b) => b.date.localeCompare(a.date));
    case 'date-asc':   return sorted.sort((a, b) => a.date.localeCompare(b.date));
    case 'desc-asc':   return sorted.sort((a, b) => a.description.localeCompare(b.description));
    case 'desc-desc':  return sorted.sort((a, b) => b.description.localeCompare(a.description));
    case 'amount-asc': return sorted.sort((a, b) => a.amount - b.amount);
    case 'amount-desc':return sorted.sort((a, b) => b.amount - a.amount);
    default: return sorted;
  }
}