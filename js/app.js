/**
 * app.js — Main Application Controller (ViewModel)
 * Orchestrates all screens, user interactions, state,
 * and data binding between DB, UI, and Charts.
 * ─────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════

const State = {
  currentPeriod : 'daily',
  currentScreen : 'dashboard',
  editingId     : null,       // expense ID being edited
  selectedCat   : 'Food',     // selected category in add form
  deleteTargetId: null,       // ID queued for deletion
  toastTimer    : null
};

// ═══════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════

window.addEventListener('load', () => {
  // Apply saved theme
  const settings = DB.getSettings();
  if (!settings.darkMode) document.body.classList.add('light-mode');
  document.getElementById('themeBtn').textContent = settings.darkMode ? '🌙' : '☀️';

  // Set greeting
  setGreeting();

  // Set today's date in add form
  document.getElementById('inputDate').value = DB.todayStr();

  // Build category grid
  buildCategoryGrid();

  // Keyword auto-detect listener
  document.getElementById('inputNote').addEventListener('input', onNoteInput);

  // Fade out splash after delay
  setTimeout(() => {
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      renderDashboard();
    }, 500);
  }, 1600);
});

// ─── GREETING ─────────────────────────────────────────

function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good Morning 👋' : h < 17 ? 'Good Afternoon 👋' : 'Good Evening 👋';
  document.getElementById('greeting').textContent = g;
}

// ─── THEME TOGGLE ─────────────────────────────────────

function toggleDark() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn     = document.getElementById('themeBtn');
  btn.textContent = isLight ? '☀️' : '🌙';
  DB.saveSettings({ darkMode: !isLight });
}

// ═══════════════════════════════════════════════════════
// SCREEN NAVIGATION
// ═══════════════════════════════════════════════════════

function switchScreen(name, btn) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById('screen-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  State.currentScreen = name;

  // Render relevant screen
  if (name === 'dashboard') renderDashboard();
  if (name === 'history')   renderHistory();
  if (name === 'insights')  renderInsightsScreen();
  if (name === 'add' && !State.editingId) {
    clearAddForm();
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════

function renderDashboard() {
  const period   = State.currentPeriod;
  const expenses = DB.getByPeriod(period);
  const total    = DB.sumAmount(expenses);

  // Summary card
  animateNumber('summaryAmount', total);
  document.getElementById('summaryLabel').textContent =
    period === 'daily' ? 'spent today' :
    period === 'weekly' ? 'spent this week' : 'spent this month';

  // Summary sub-line
  const cnt = expenses.length;
  document.getElementById('summarySub').textContent =
    cnt === 0 ? 'No expenses recorded' :
    cnt === 1 ? '1 transaction' : `${cnt} transactions`;

  // Charts
  Charts.refreshAll(expenses);

  // Insights (quick 3)
  const insights = Insights.generate();
  const insEl    = document.getElementById('insightsList');
  insEl.innerHTML = insights.slice(0, 3).map(renderInsightCard).join('') ||
    '<div class="insight-empty">Add expenses to see insights!</div>';

  // Goal card
  renderGoalCard();

  // Gamification
  renderGamify();

  // Recent list (last 5)
  renderRecentList();
}

function setPeriod(period, btn) {
  State.currentPeriod = period;
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDashboard();
}

// ─── ANIMATE NUMBER ───────────────────────────────────

function animateNumber(elId, targetValue) {
  const el     = document.getElementById(elId);
  const start  = 0;
  const dur    = 400;
  const t0     = performance.now();
  const fmt    = v => '₹' + Math.round(v).toLocaleString('en-IN');

  const tick = now => {
    const elapsed = now - t0;
    const progress = Math.min(elapsed / dur, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = fmt(start + (targetValue - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ─── GOAL CARD ────────────────────────────────────────

function renderGoalCard() {
  const settings = DB.getSettings();
  const card     = document.getElementById('goalCard');

  if (!settings.monthlyGoal || settings.monthlyGoal <= 0) {
    card.classList.add('hidden');
    return;
  }

  card.classList.remove('hidden');
  const monthly = DB.sumAmount(DB.getByPeriod('monthly'));
  const pct     = Math.min((monthly / settings.monthlyGoal) * 100, 100);
  const over    = monthly > settings.monthlyGoal;

  document.getElementById('goalBar').style.width = pct + '%';
  document.getElementById('goalBar').classList.toggle('danger', pct >= 80);
  document.getElementById('goalPct').textContent = Math.round(pct) + '%';
  document.getElementById('goalSpent').textContent  = 'Spent: ₹' + Math.round(monthly).toLocaleString('en-IN');
  document.getElementById('goalTarget').textContent = 'Goal: ₹' + Math.round(settings.monthlyGoal).toLocaleString('en-IN');

  const warn = document.getElementById('goalWarning');
  if (over) {
    warn.textContent = `⚠️ Over budget by ₹${Math.round(monthly - settings.monthlyGoal).toLocaleString('en-IN')}!`;
    warn.classList.remove('hidden');
  } else {
    warn.classList.add('hidden');
  }
}

// ─── GAMIFICATION ────────────────────────────────────

function renderGamify() {
  const meta    = DB.getMeta();
  const all     = DB.getAllExpenses();
  const monthly = DB.sumAmount(DB.getByPeriod('monthly'));
  const goal    = DB.getSettings().monthlyGoal;
  const level   = Insights.getLevel(all.length, monthly, goal);

  document.getElementById('streakVal').textContent  = meta.streak || 0;
  document.getElementById('levelIcon').textContent  = level.icon;
  document.getElementById('levelName').textContent  = level.name;
  document.getElementById('totalTxn').textContent   = all.length;
}

// ─── RECENT LIST ──────────────────────────────────────

function renderRecentList() {
  const el   = document.getElementById('recentList');
  const last5 = DB.getAllExpenses().slice(0, 5);

  if (last5.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💸</div>
        <div>No expenses yet</div>
        <div class="empty-sub">Tap + to add your first expense</div>
      </div>`;
    return;
  }

  el.innerHTML = last5.map(renderExpenseItem).join('');
}

// ─── EXPENSE ITEM HTML ────────────────────────────────

function renderExpenseItem(e) {
  const cat  = Insights.getCatMeta(e.category);
  const date = new Date(e.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' });

  return `
    <div class="expense-item" onclick="openExpenseDetail('${e.id}')">
      <div class="expense-cat-icon cat-${e.category.toLowerCase()}">${cat.emoji}</div>
      <div class="expense-info">
        <div class="expense-note">${e.note || e.category}</div>
        <div class="expense-meta">${e.category} · ${date}</div>
        <div class="expense-actions" onclick="event.stopPropagation()">
          <button class="action-btn" onclick="editExpense('${e.id}')">✏️ Edit</button>
          <button class="action-btn del" onclick="openDeleteModal('${e.id}')">🗑️ Delete</button>
        </div>
      </div>
      <div class="expense-amount">₹${Math.round(e.amount).toLocaleString('en-IN')}</div>
    </div>`;
}

// ─── INSIGHT CARD HTML ────────────────────────────────

function renderInsightCard(ins) {
  return `<div class="insight-card ${ins.type}">${ins.text}</div>`;
}

// ═══════════════════════════════════════════════════════
// ADD / EDIT EXPENSE
// ═══════════════════════════════════════════════════════

function buildCategoryGrid() {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = Insights.CATEGORIES.map(cat => `
    <button class="cat-option ${cat.name === State.selectedCat ? 'selected' : ''}"
            onclick="selectCategory('${cat.name}', this)">
      <span class="cat-emoji">${cat.emoji}</span>
      ${cat.name}
    </button>`).join('');
}

function selectCategory(name, btn) {
  State.selectedCat = name;
  document.querySelectorAll('.cat-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ─── AUTO DETECT FROM NOTE ────────────────────────────

function onNoteInput() {
  const note     = document.getElementById('inputNote').value;
  const detected = Insights.detectCategory(note);
  const detEl    = document.getElementById('autoDetect');
  const catEl    = document.getElementById('autoCategory');

  if (detected) {
    catEl.textContent = Insights.getCatMeta(detected).emoji + ' ' + detected;
    detEl.classList.remove('hidden');
    // Auto-select the detected category
    State.selectedCat = detected;
    document.querySelectorAll('.cat-option').forEach(btn => {
      const match = btn.textContent.trim().includes(detected);
      btn.classList.toggle('selected', match);
    });
  } else {
    detEl.classList.add('hidden');
  }
}

// ─── SAVE EXPENSE ─────────────────────────────────────

function saveExpense() {
  const amount = parseFloat(document.getElementById('inputAmount').value);
  const note   = document.getElementById('inputNote').value.trim();
  const date   = document.getElementById('inputDate').value;

  // Validation
  if (!amount || amount <= 0) {
    showToast('⚠️ Please enter a valid amount');
    document.getElementById('inputAmount').focus();
    return;
  }
  if (!date) {
    showToast('⚠️ Please select a date');
    return;
  }

  const btn = document.getElementById('saveBtn');
  btn.style.opacity = '0.7';

  if (State.editingId) {
    // UPDATE mode
    DB.updateExpense(State.editingId, {
      amount, note, date, category: State.selectedCat
    });
    showToast('✅ Expense updated!');
    State.editingId = null;
  } else {
    // INSERT mode
    DB.addExpense({ amount, category: State.selectedCat, note, date });
    showToast('✅ Expense saved!');
  }

  btn.style.opacity = '1';
  clearAddForm();

  // Navigate back to dashboard
  setTimeout(() => {
    switchScreen('dashboard', document.querySelector('.nav-item'));
    document.querySelectorAll('.nav-item')[0].classList.add('active');
  }, 400);
}

function clearAddForm() {
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputNote').value   = '';
  document.getElementById('inputDate').value   = DB.todayStr();
  document.getElementById('autoDetect').classList.add('hidden');
  document.getElementById('saveBtn').querySelector('span').textContent = '💾 Save Expense';
  document.getElementById('cancelEditBtn').classList.add('hidden');

  // Reset category to Food
  State.selectedCat  = 'Food';
  State.editingId    = null;
  document.querySelectorAll('.cat-option').forEach((btn, i) => {
    btn.classList.toggle('selected', i === 0);
  });
}

// ─── EDIT EXPENSE ─────────────────────────────────────

function editExpense(id) {
  const expense = DB.getAllExpenses().find(e => e.id === id);
  if (!expense) return;

  State.editingId   = id;
  State.selectedCat = expense.category;

  document.getElementById('inputAmount').value = expense.amount;
  document.getElementById('inputNote').value   = expense.note;
  document.getElementById('inputDate').value   = expense.date;
  document.getElementById('saveBtn').querySelector('span').textContent = '💾 Update Expense';
  document.getElementById('cancelEditBtn').classList.remove('hidden');

  // Update category grid
  document.querySelectorAll('.cat-option').forEach(btn => {
    btn.classList.toggle('selected', btn.textContent.trim().includes(expense.category));
  });

  // Switch to add screen
  switchScreen('add', document.querySelectorAll('.nav-item')[1]);
  document.querySelectorAll('.nav-item')[1].classList.add('active');
}

function cancelEdit() {
  State.editingId = null;
  clearAddForm();
  switchScreen('dashboard', document.querySelectorAll('.nav-item')[0]);
  document.querySelectorAll('.nav-item')[0].classList.add('active');
}

// ─── EXPAND EXPENSE DETAIL ────────────────────────────

function openExpenseDetail(id) {
  // Just expand the item's actions on tap — edit/delete visible
  // (Already shown in renderExpenseItem)
}

// ═══════════════════════════════════════════════════════
// HISTORY SCREEN
// ═══════════════════════════════════════════════════════

function renderHistory() {
  const search     = (document.getElementById('searchInput').value || '').toLowerCase();
  const filterCat  = document.getElementById('filterCat').value;
  const filterPer  = document.getElementById('filterPeriod').value;
  const container  = document.getElementById('historyList');

  let expenses = DB.getAllExpenses();

  // Filter by search
  if (search) {
    expenses = expenses.filter(e =>
      e.note.toLowerCase().includes(search) ||
      e.category.toLowerCase().includes(search)
    );
  }

  // Filter by category
  if (filterCat) expenses = expenses.filter(e => e.category === filterCat);

  // Filter by period
  if (filterPer !== 'all') {
    const now = new Date();
    expenses = expenses.filter(e => {
      const d = new Date(e.date);
      if (filterPer === 'today')  return e.date === DB.todayStr();
      if (filterPer === 'week')   {
        const start = new Date(now); start.setDate(now.getDate() - 7);
        return d >= start;
      }
      if (filterPer === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  if (expenses.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div>No expenses found</div></div>`;
    return;
  }

  // Group by date
  const groups = {};
  expenses.forEach(e => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });

  container.innerHTML = Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(date => {
    const label = formatDateLabel(date);
    const dayTotal = groups[date].reduce((s, e) => s + e.amount, 0);
    return `
      <div class="history-date-group">
        <div class="history-date-label">${label} · ₹${Math.round(dayTotal).toLocaleString('en-IN')}</div>
        ${groups[date].map(renderExpenseItem).join('')}
      </div>`;
  }).join('');
}

function formatDateLabel(dateStr) {
  const d   = new Date(dateStr);
  const today = DB.todayStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday.toISOString().slice(0,10)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });
}

// ═══════════════════════════════════════════════════════
// INSIGHTS SCREEN
// ═══════════════════════════════════════════════════════

function renderInsightsScreen() {
  // Full insights list
  const insights = Insights.generate();
  document.getElementById('fullInsights').innerHTML =
    insights.map(renderInsightCard).join('') ||
    '<div class="insight-empty">Add expenses to unlock insights!</div>';

  // Category breakdown
  const monthly   = DB.getByPeriod('monthly');
  const grouped   = DB.groupByCategory(monthly);
  const total     = DB.sumAmount(monthly);
  const container = document.getElementById('catBreakdown');

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = '<div class="insight-empty">No data for this month.</div>';
    return;
  }

  const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]);
  container.innerHTML = sorted.map(([cat, amt]) => {
    const meta  = Insights.getCatMeta(cat);
    const pct   = total > 0 ? (amt / total * 100).toFixed(0) : 0;
    return `
      <div class="cat-row">
        <div class="cat-row-header">
          <span class="cat-row-name">${meta.emoji} ${cat}</span>
          <span class="cat-row-amount">₹${Math.round(amt).toLocaleString('en-IN')} (${pct}%)</span>
        </div>
        <div class="cat-row-bar-wrap">
          <div class="cat-row-bar" style="width:${pct}%;background:${meta.color}"></div>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// GOAL MODAL
// ═══════════════════════════════════════════════════════

function openGoalModal() {
  const settings = DB.getSettings();
  if (settings.monthlyGoal) {
    document.getElementById('goalInput').value = settings.monthlyGoal;
  }
  document.getElementById('goalModal').classList.remove('hidden');
}

function closeGoalModal(e) {
  if (!e || e.target.id === 'goalModal') {
    document.getElementById('goalModal').classList.add('hidden');
  }
}

function saveGoal() {
  const val = parseFloat(document.getElementById('goalInput').value);
  if (!val || val <= 0) {
    showToast('⚠️ Enter a valid goal amount');
    return;
  }
  DB.saveSettings({ monthlyGoal: val });
  closeGoalModal();
  showToast('🎯 Monthly goal set to ₹' + Math.round(val).toLocaleString('en-IN'));
  renderDashboard();
}

// ═══════════════════════════════════════════════════════
// DELETE MODAL
// ═══════════════════════════════════════════════════════

function openDeleteModal(id) {
  State.deleteTargetId = id;
  document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal(e) {
  if (!e || e.target.id === 'deleteModal') {
    document.getElementById('deleteModal').classList.add('hidden');
    State.deleteTargetId = null;
  }
}

function confirmDelete() {
  if (!State.deleteTargetId) return;
  DB.deleteExpense(State.deleteTargetId);
  closeDeleteModal();
  showToast('🗑️ Expense deleted');

  // Refresh current screen
  if (State.currentScreen === 'dashboard') renderDashboard();
  if (State.currentScreen === 'history')   renderHistory();
  if (State.currentScreen === 'insights')  renderInsightsScreen();
}

// ═══════════════════════════════════════════════════════
// EXPORT & SHARE
// ═══════════════════════════════════════════════════════

function exportCSV() {
  const expenses = DB.getAllExpenses();
  if (expenses.length === 0) {
    showToast('No data to export');
    return;
  }

  const header = 'Date,Category,Note,Amount\n';
  const rows   = expenses.map(e =>
    `${e.date},${e.category},"${e.note.replace(/"/g, '""')}",${e.amount}`
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `your-expenses-${DB.todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 CSV exported!');
}

function shareInsight() {
  const insights = Insights.generate();
  const monthly  = DB.sumAmount(DB.getByPeriod('monthly'));
  const text     = `📊 My Expense Summary (${new Date().toLocaleDateString('en-IN', {month:'long', year:'numeric'})})\n\nTotal spent: ₹${Math.round(monthly).toLocaleString('en-IN')}\n\n${insights.slice(0,3).map(i => i.text).join('\n')}\n\nTracked with Your Expenses 💰`;

  if (navigator.share) {
    navigator.share({ title: 'My Expense Insights', text }).catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
}

// ═══════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');

  clearTimeout(State.toastTimer);
  State.toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ═══════════════════════════════════════════════════════
// SERVICE WORKER REGISTRATION (PWA offline support)
// ═══════════════════════════════════════════════════════

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
