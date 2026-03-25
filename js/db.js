/**
 * db.js — Local Database Layer
 * Uses localStorage for persistent offline storage.
 * Acts like a Room/SQLite database with CRUD operations.
 * ─────────────────────────────────────────────────────
 */

const DB = (() => {

  const EXPENSES_KEY = 'ye_expenses';
  const SETTINGS_KEY = 'ye_settings';
  const META_KEY     = 'ye_meta';

  // ─── helpers ─────────────────────────────────────
  const load = key => {
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch { return null; }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ─── EXPENSES TABLE ───────────────────────────────

  /** Get all expenses, newest first */
  function getAllExpenses() {
    return (load(EXPENSES_KEY) || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /** Insert a new expense record */
  function addExpense({ amount, category, note, date }) {
    const expenses = load(EXPENSES_KEY) || [];
    const record = {
      id: genId(),
      amount: parseFloat(amount),
      category,
      note: note || '',
      date: date || todayStr(),
      createdAt: Date.now()
    };
    expenses.push(record);
    save(EXPENSES_KEY, expenses);
    updateMeta(record);
    return record;
  }

  /** Update an existing expense by id */
  function updateExpense(id, updates) {
    const expenses = load(EXPENSES_KEY) || [];
    const idx = expenses.findIndex(e => e.id === id);
    if (idx === -1) return false;
    expenses[idx] = { ...expenses[idx], ...updates, amount: parseFloat(updates.amount) };
    save(EXPENSES_KEY, expenses);
    return true;
  }

  /** Delete an expense by id */
  function deleteExpense(id) {
    const expenses = load(EXPENSES_KEY) || [];
    save(EXPENSES_KEY, expenses.filter(e => e.id !== id));
  }

  // ─── SETTINGS ─────────────────────────────────────

  function getSettings() {
    return load(SETTINGS_KEY) || {
      monthlyGoal: 0,
      darkMode: true
    };
  }

  function saveSettings(updates) {
    const curr = getSettings();
    save(SETTINGS_KEY, { ...curr, ...updates });
  }

  // ─── META (streak, level) ─────────────────────────

  function getMeta() {
    return load(META_KEY) || {
      streak: 0,
      lastEntryDate: null,
      totalEntries: 0
    };
  }

  function updateMeta(record) {
    const meta = getMeta();
    const today = todayStr();
    if (meta.lastEntryDate === today) {
      // same day — just increment count
    } else if (isYesterday(meta.lastEntryDate)) {
      meta.streak += 1;
    } else {
      meta.streak = 1;
    }
    meta.lastEntryDate = today;
    meta.totalEntries = (load(EXPENSES_KEY) || []).length;
    save(META_KEY, meta);
  }

  // ─── QUERY HELPERS ────────────────────────────────

  /** Filter expenses by date range */
  function getByPeriod(period) {
    const all = getAllExpenses();
    const now = new Date();
    if (period === 'daily') {
      return all.filter(e => e.date === todayStr());
    }
    if (period === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Sunday
      start.setHours(0,0,0,0);
      return all.filter(e => new Date(e.date) >= start);
    }
    if (period === 'monthly') {
      return all.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    return all;
  }

  /** Sum of amounts for a list of expenses */
  function sumAmount(expenses) {
    return expenses.reduce((s, e) => s + e.amount, 0);
  }

  /** Group expenses by category, return { category: total } */
  function groupByCategory(expenses) {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  }

  /** Get daily totals for last 7 days */
  function getWeeklyDailyTotals() {
    const all = getAllExpenses();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const total = all.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
      days.push({ date: ds, label: d.toLocaleDateString('en', { weekday: 'short' }), total });
    }
    return days;
  }

  // ─── UTILS ───────────────────────────────────────

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function isYesterday(dateStr) {
    if (!dateStr) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === yesterday.toISOString().slice(0, 10);
  }

  function clearAll() {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(META_KEY);
  }

  // ─── PUBLIC API ───────────────────────────────────
  return {
    getAllExpenses, addExpense, updateExpense, deleteExpense,
    getSettings, saveSettings,
    getMeta,
    getByPeriod, sumAmount, groupByCategory, getWeeklyDailyTotals,
    todayStr
  };

})();
