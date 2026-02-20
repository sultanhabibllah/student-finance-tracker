import { highlight } from './search.js';

// ===== NAVIGATION =====
export function initNav(onNavigate) {
  const links = document.querySelectorAll('.nav-link');
  const toggle = document.querySelector('.nav-toggle');
  const navEl = document.querySelector('nav');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.section;
      navigateTo(target);
      navEl.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (onNavigate) onNavigate(target);
    });
  });

  // Hero CTA button
  const heroCta = document.getElementById('hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', e => {
      e.preventDefault();
      navigateTo('dashboard');
      if (onNavigate) onNavigate('dashboard');
    });
  }

  toggle.addEventListener('click', () => {
    const open = navEl.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      navEl.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

export function navigateTo(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const section = document.getElementById(sectionId);
  const link = document.querySelector(`[data-section="${sectionId}"]`);
  if (section) section.classList.add('active');
  if (link) link.classList.add('active');
}

// ===== RECORDS TABLE =====
export function renderRecords(records, re) {
  const tbody = document.getElementById('records-body');
  const empty = document.getElementById('empty-state');
  const statusEl = document.getElementById('records-status');

  tbody.innerHTML = '';

  if (records.length === 0) {
    empty.classList.remove('hidden');
    statusEl.textContent = 'No records found.';
    return;
  }

  empty.classList.add('hidden');
  statusEl.textContent = `Showing ${records.length} record${records.length !== 1 ? 's' : ''}.`;

  records.forEach(record => {
    const tr = document.createElement('tr');
    tr.dataset.id = record.id;
    tr.innerHTML = `
      <td>${highlight(record.description, re)}</td>
      <td>RWF${parseFloat(record.amount).toFixed(2)}</td>
      <td><span class="badge">${highlight(record.category, re)}</span></td>
      <td>${record.date}</td>
      <td class="actions-cell">
        <button class="btn btn-sm btn-secondary edit-btn" data-id="${record.id}" aria-label="Edit ${record.description}">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn" data-id="${record.id}" aria-label="Delete ${record.description}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== INLINE EDIT =====
export function makeRowEditable(id, record, categories) {
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  if (!tr) return;

  const catOptions = categories.map(c =>
    `<option value="${c}" ${c === record.category ? 'selected' : ''}>${c}</option>`
  ).join('');

  tr.innerHTML = `
    <td><input class="edit-input" data-field="description" value="${escAttr(record.description)}" aria-label="Description" /></td>
    <td><input class="edit-input" data-field="amount" value="${record.amount}" aria-label="Amount" /></td>
    <td>
      <select class="edit-input" data-field="category" aria-label="Category">
        ${catOptions}
      </select>
    </td>
    <td><input class="edit-input" data-field="date" value="${record.date}" aria-label="Date" /></td>
    <td class="actions-cell">
      <button class="btn btn-sm btn-primary save-inline-btn" data-id="${id}">Save</button>
      <button class="btn btn-sm btn-ghost cancel-inline-btn" data-id="${id}">Cancel</button>
    </td>
  `;

  tr.querySelector('.edit-input').focus();
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// ===== DASHBOARD =====
// Renders into either home section or dashboard section depending on suffix
export function renderDashboard(records, settings, suffix = '') {
  const totalEl = document.getElementById(`stat-total${suffix}`);
  const sumEl = document.getElementById(`stat-sum${suffix}`);
  const topCatEl = document.getElementById(`stat-top-cat${suffix}`);
  const remainingEl = document.getElementById(`stat-remaining${suffix}`);
  const capAlertEl = document.getElementById(`cap-alert${suffix}`);
  const barChartEl = document.getElementById(`bar-chart${suffix}`);
  const catBarsEl = document.getElementById(`category-bars${suffix}`);

  if (!totalEl) return;

  const total = records.length;
  const sum = records.reduce((acc, r) => acc + parseFloat(r.amount), 0);

  const catCount = {};
  records.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + parseFloat(r.amount); });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];

  totalEl.textContent = total;
  sumEl.textContent = `RWF${sum.toFixed(2)}`;
  topCatEl.textContent = topCat ? topCat[0] : '—';

  // Budget cap
  const cap = parseFloat(settings.budgetCap);
  if (!isNaN(cap) && cap > 0) {
    const remaining = cap - sum;
    remainingEl.textContent = remaining >= 0
      ? `RWF${remaining.toFixed(2)}`
      : `-RWF${Math.abs(remaining).toFixed(2)}`;
    capAlertEl.classList.remove('hidden', 'under', 'over');
    if (remaining >= 0) {
      capAlertEl.textContent = `You're within budget. RWF${remaining.toFixed(2)} remaining of RWF${cap.toFixed(2)}.`;
      capAlertEl.classList.add('under');
      capAlertEl.setAttribute('aria-live', 'polite');
    } else {
      capAlertEl.textContent = `⚠️ Budget exceeded by RWF${Math.abs(remaining).toFixed(2)}! (Cap: RWF${cap.toFixed(2)})`;
      capAlertEl.classList.add('over');
      capAlertEl.setAttribute('aria-live', 'assertive');
    }
  } else {
    capAlertEl.classList.add('hidden');
    remainingEl.textContent = '—';
  }

  renderBarChart(records, barChartEl);
  renderCategoryBars(records, catCount, sum, catBarsEl);
}

function renderBarChart(records, chartEl) {
  if (!chartEl) return;
  chartEl.innerHTML = '';

  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const dayTotals = {};
  days.forEach(d => { dayTotals[d] = 0; });
  records.forEach(r => {
    if (dayTotals[r.date] !== undefined) {
      dayTotals[r.date] += parseFloat(r.amount);
    }
  });

  const maxVal = Math.max(...Object.values(dayTotals), 1);

  days.forEach(day => {
    const val = dayTotals[day];
    const pct = (val / maxVal) * 100;
    const label = day.slice(5);
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar" style="height:${pct}%" data-value="RWF${val.toFixed(2)}" title="RWF${val.toFixed(2)} on ${day}"></div>
      <span class="bar-label">${label}</span>
    `;
    chartEl.appendChild(col);
  });
}

function renderCategoryBars(records, catCount, totalSum, container) {
  if (!container) return;
  container.innerHTML = '';
  if (!totalSum) return;

  Object.entries(catCount).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
    const pct = (amt / totalSum) * 100;
    const row = document.createElement('div');
    row.className = 'category-bar-row';
    row.innerHTML = `
      <span class="category-bar-label">${cat}</span>
      <div class="category-bar-track" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100" aria-label="${cat}: ${pct.toFixed(0)}%">
        <div class="category-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="category-bar-amount">RWF${amt.toFixed(2)}</span>
    `;
    container.appendChild(row);
  });
}

// ===== FORM =====
export function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorId = fieldId.replace('field-', '') + '-error';
  const error = document.getElementById(errorId);
  if (input) { input.classList.toggle('invalid', !!message); input.classList.toggle('valid', !message); }
  if (error) error.textContent = message || '';
}

export function clearForm() {
  document.getElementById('record-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('add-heading').textContent = 'Add Record';
  document.getElementById('submit-btn').textContent = 'Add Record';
  document.getElementById('cancel-edit-btn').hidden = true;
  ['field-description', 'field-amount', 'field-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('invalid', 'valid');
  });
  ['desc-error', 'amount-error', 'date-error', 'category-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  document.getElementById('form-status').textContent = '';
}

export function populateFormForEdit(record) {
  document.getElementById('edit-id').value = record.id;
  document.getElementById('field-description').value = record.description;
  document.getElementById('field-amount').value = record.amount;
  document.getElementById('field-category').value = record.category;
  document.getElementById('field-date').value = record.date;
  document.getElementById('add-heading').textContent = 'Edit Record';
  document.getElementById('submit-btn').textContent = 'Save Changes';
  document.getElementById('cancel-edit-btn').hidden = false;
}

// ===== SETTINGS =====
export function loadSettingsIntoForm(settings) {
  if (settings.budgetCap) document.getElementById('budget-cap').value = settings.budgetCap;
  if (settings.rateUSD) document.getElementById('rate-usd').value = settings.rateUSD;
  if (settings.rateEUR) document.getElementById('rate-eur').value = settings.rateEUR;
}

export function renderCategoryList(categories, onRemove) {
  const list = document.getElementById('category-list');
  const select = document.getElementById('field-category');
  list.innerHTML = '';

  const defaultCats = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];
  const all = [...new Set([...defaultCats, ...categories])];
  select.innerHTML = '<option value="">Select a category</option>' +
    all.map(c => `<option value="${c}">${c}</option>`).join('');

  categories.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'category-tag';
    li.innerHTML = `${cat} <button aria-label="Remove ${cat}" data-cat="${cat}">×</button>`;
    li.querySelector('button').addEventListener('click', () => onRemove(cat));
    list.appendChild(li);
  });
}

// ===== DIALOG =====
export function showDialog(onConfirm) {
  const overlay = document.getElementById('confirm-dialog');
  overlay.classList.remove('hidden');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');
  yesBtn.focus();

  function cleanup() {
    overlay.classList.add('hidden');
    yesBtn.removeEventListener('click', handleYes);
    noBtn.removeEventListener('click', handleNo);
    document.removeEventListener('keydown', handleKey);
  }
  function handleYes() { cleanup(); onConfirm(); }
  function handleNo() { cleanup(); }
  function handleKey(e) {
    if (e.key === 'Escape') handleNo();
    if (e.key === 'Tab') {
      e.preventDefault();
      const focusable = [yesBtn, noBtn];
      focusable[(focusable.indexOf(document.activeElement) + 1) % focusable.length].focus();
    }
  }

  yesBtn.addEventListener('click', handleYes);
  noBtn.addEventListener('click', handleNo);
  document.addEventListener('keydown', handleKey);
}

// ===== STATUS =====
export function showStatus(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { el.textContent = ''; }, 3000);
}