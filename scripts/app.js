import * as State from './state.js';
import * as UI from './ui.js';
import { compileRegex, filterRecords } from './search.js';
import {
  validateDescription, validateAmount, validateDate,
  validateCategory, validateCustomCategory,
  validateBudgetCap, validateCurrencyRate
} from './validators.js';

let currentRegex = null;

// ===== BOOT =====
State.init();
UI.initNav(onNavigate);
UI.loadSettingsIntoForm(State.getSettings());
renderCustomCategories();
refreshRecords();
refreshDashboard();

function onNavigate(section) {
  if (section === 'home' || section === 'dashboard') refreshDashboard();
  if (section === 'add') UI.clearForm();
}

// ===== DASHBOARD =====
function refreshDashboard() {
  const records = State.getRecords();
  const settings = State.getSettings();
  UI.renderDashboard(records, settings, '');
  UI.renderDashboard(records, settings, '-dash');
}

// ===== RECORDS =====
function refreshRecords() {
  const sortKey = document.getElementById('sort-select').value;
  let recs = State.sortRecords(State.getRecords(), sortKey);
  recs = filterRecords(recs, currentRegex);
  UI.renderRecords(recs, currentRegex);
  attachRecordEvents();
}

function attachRecordEvents() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => handleEditClick(btn.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteClick(btn.dataset.id));
  });
}

// ===== SEARCH =====
const searchInput = document.getElementById('search-input');
const searchCase = document.getElementById('search-case');
const searchError = document.getElementById('search-error');

function doSearch() {
  const val = searchInput.value.trim();
  const result = compileRegex(val, searchCase.checked);
  if (result === 'invalid') {
    searchError.textContent = 'Invalid regex pattern.';
    currentRegex = null;
  } else {
    searchError.textContent = '';
    currentRegex = result;
  }
  refreshRecords();
}

searchInput.addEventListener('input', doSearch);
searchCase.addEventListener('change', doSearch);

// ===== SORT =====
document.getElementById('sort-select').addEventListener('change', refreshRecords);

// ===== ADD/EDIT FORM =====
const form = document.getElementById('record-form');

form.addEventListener('submit', e => {
  e.preventDefault();
  const description = document.getElementById('field-description').value.trim();
  const amount = document.getElementById('field-amount').value.trim();
  const category = document.getElementById('field-category').value;
  const date = document.getElementById('field-date').value.trim();
  const editId = document.getElementById('edit-id').value;

  const descErr = validateDescription(description);
  const amtErr = validateAmount(amount);
  const catErr = validateCategory(category);
  const dateErr = validateDate(date);

  UI.setFieldError('field-description', descErr);
  UI.setFieldError('field-amount', amtErr);
  UI.setFieldError('field-category', catErr);
  UI.setFieldError('field-date', dateErr);

  if (descErr || amtErr || catErr || dateErr) return;

  const now = new Date().toISOString();

  if (editId) {
    State.updateRecord(editId, { description, amount: parseFloat(amount), category, date });
    UI.showStatus('form-status', 'Record updated successfully!');
  } else {
    State.addRecord({
      id: State.generateId(),
      description,
      amount: parseFloat(amount),
      category,
      date,
      createdAt: now,
      updatedAt: now
    });
    UI.showStatus('form-status', 'Record added successfully!');
  }

  UI.clearForm();
  refreshRecords();
  refreshDashboard();
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
  UI.clearForm();
});

// ===== INLINE EDIT =====
function handleEditClick(id) {
  const record = State.getRecords().find(r => r.id === id);
  if (!record) return;

  const defaultCats = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
  const custom = State.getSettings().customCategories || [];
  const categories = [...new Set([...defaultCats, ...custom])];

  UI.makeRowEditable(id, record, categories);

  const tr = document.querySelector(`tr[data-id="${id}"]`);

  tr.querySelector('.save-inline-btn').addEventListener('click', () => {
    const inputs = tr.querySelectorAll('.edit-input');
    const updates = {};
    inputs.forEach(inp => { updates[inp.dataset.field] = inp.value; });

    const descErr = validateDescription(updates.description);
    const amtErr = validateAmount(updates.amount);
    const dateErr = validateDate(updates.date);

    if (descErr || amtErr || dateErr) {
      alert(descErr || amtErr || dateErr);
      return;
    }

    updates.amount = parseFloat(updates.amount);
    State.updateRecord(id, updates);
    refreshRecords();
    refreshDashboard();
  });

  tr.querySelector('.cancel-inline-btn').addEventListener('click', () => {
    refreshRecords();
  });
}

// ===== DELETE =====
function handleDeleteClick(id) {
  UI.showDialog(() => {
    State.deleteRecord(id);
    refreshRecords();
    refreshDashboard();
  });
}

// ===== EXPORT =====
document.getElementById('export-btn').addEventListener('click', () => {
  const data = State.getRecords();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance-records.json';
  a.click();
  URL.revokeObjectURL(url);
});

// ===== IMPORT =====
document.getElementById('import-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!Array.isArray(parsed)) throw new Error('Root must be an array.');

      const valid = parsed.filter(r =>
        r.id && typeof r.description === 'string' &&
        typeof r.amount === 'number' && r.category && r.date
      );
      if (valid.length === 0) throw new Error('No valid records found.');

      const existingIds = new Set(State.getRecords().map(r => r.id));
      const toAdd = valid.filter(r => !existingIds.has(r.id));
      toAdd.forEach(r => State.addRecord(r));

      alert(`Imported ${toAdd.length} new record(s). ${valid.length - toAdd.length} skipped (duplicate id).`);
      refreshRecords();
      refreshDashboard();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ===== SETTINGS =====
document.getElementById('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  const budgetCap = document.getElementById('budget-cap').value.trim();
  const rateUSD = document.getElementById('rate-usd').value.trim();
  const rateEUR = document.getElementById('rate-eur').value.trim();

  const capErr = validateBudgetCap(budgetCap);
  document.getElementById('cap-error').textContent = capErr || '';
  if (capErr) return;

  State.updateSettings({ budgetCap, rateUSD, rateEUR });
  UI.showStatus('settings-status', 'Settings saved!');
  refreshDashboard();
});

// ===== CURRENCY CONVERTER =====
document.getElementById('convert-amount').addEventListener('input', e => {
  const val = parseFloat(e.target.value);
  const settings = State.getSettings();
  const result = document.getElementById('conversion-result');
  if (isNaN(val) || val <= 0) { result.textContent = ''; return; }
  const usd = val * (parseFloat(settings.rateUSD) || 0.00073);
  const eur = val * (parseFloat(settings.rateEUR) || 0.00067);
  result.textContent = `RWF${val.toFixed(2)} = $${usd.toFixed(4)} USD | €${eur.toFixed(4)} EUR`;
});

// ===== CUSTOM CATEGORIES =====
function getDefaultCategories() {
  return ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
}

function renderCustomCategories() {
  const custom = State.getSettings().customCategories || [];
  UI.renderCategoryList(custom, removeCategory);
}

document.getElementById('add-category-btn').addEventListener('click', () => {
  const input = document.getElementById('custom-category');
  const val = input.value.trim();
  const err = validateCustomCategory(val);
  document.getElementById('custom-cat-error').textContent = err || '';
  if (err) return;

  const custom = State.getSettings().customCategories || [];
  const all = [...getDefaultCategories(), ...custom];
  if (all.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
    document.getElementById('custom-cat-error').textContent = 'Category already exists.';
    return;
  }
  custom.push(val);
  State.updateSettings({ customCategories: custom });
  input.value = '';
  renderCustomCategories();
});

document.getElementById('custom-category').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('add-category-btn').click();
  }
});

function removeCategory(cat) {
  const custom = (State.getSettings().customCategories || []).filter(c => c !== cat);
  State.updateSettings({ customCategories: custom });
  renderCustomCategories();
}