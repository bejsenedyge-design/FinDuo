/**
 * FinTrack Database Layer
 * Handles users, sessions, and per-user state in localStorage.
 */
const DB = {
  KEYS: {
    USERS:   'ft_users',
    SESSION: 'ft_session',
    STATE:   'ft_state_',
  },

  /* ── Password hashing (SHA-256 via Web Crypto) ─────────────────── */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'fintrack_v1_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /* ── Users ─────────────────────────────────────────────────────── */
  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]'); }
    catch { return []; }
  },

  _saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  async register(username, password) {
    const users = this.getUsers();
    const uname = username.trim().toLowerCase();
    if (!uname || !password) return { ok: false, err: 'err_fill_all' };
    if (uname.length < 4 || password.length < 4) return { ok: false, err: 'err_short' };
    if (users.find(u => u.username === uname)) return { ok: false, err: 'err_user_exists' };
    const passwordHash = await this.hashPassword(password);
    users.push({ username: uname, passwordHash, displayName: username.trim(), createdAt: new Date().toISOString() });
    this._saveUsers(users);
    return { ok: true };
  },

  async login(username, password) {
    const users = this.getUsers();
    const uname = username.trim().toLowerCase();
    if (!uname || !password) return { ok: false, err: 'err_fill_all' };
    const user = users.find(u => u.username === uname);
    if (!user) return { ok: false, err: 'err_user_not_found' };
    const passwordHash = await this.hashPassword(password);
    if (user.passwordHash !== passwordHash) return { ok: false, err: 'err_wrong_password' };
    const session = { username: uname, displayName: user.displayName || uname, loginAt: new Date().toISOString() };
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
    return { ok: true, session };
  },

  logout() {
    localStorage.removeItem(this.KEYS.SESSION);
  },

  getSession() {
    try {
      const raw = localStorage.getItem(this.KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  getCurrentUser() {
    const s = this.getSession();
    return s ? s.username : null;
  },

  getDisplayName() {
    const s = this.getSession();
    return s ? (s.displayName || s.username) : null;
  },

  /* ── Per-user State ────────────────────────────────────────────── */
  DEFAULT_STATE: {
    coins: 0, streak: 0, lastEntryDate: null,
    totalEntries: 0, lessonsCompleted: 0,
    unlockedAchievements: [], weeklyBudget: 30000,
    expenses: [], lessonProgress: {}, language: 'ru', theme: 'dark',
  },

  getUserState(username) {
    try {
      const raw = localStorage.getItem(this.KEYS.STATE + username);
      if (!raw) return { ...this.DEFAULT_STATE };
      return { ...this.DEFAULT_STATE, ...JSON.parse(raw) };
    } catch { return { ...this.DEFAULT_STATE }; }
  },

  saveUserState(username, state) {
    localStorage.setItem(this.KEYS.STATE + username, JSON.stringify(state));
  },

  resetUserState(username) {
    const current = this.getUserState(username);
    const fresh = { ...this.DEFAULT_STATE, language: current.language, theme: current.theme };
    this.saveUserState(username, fresh);
    return fresh;
  },
};
