/**
 * FinTrack Main App Logic
 * Depends on: config.js, db.js, i18n.js, ui.js
 */

/* ─── Auth Guard ─────────────────────────────────────────────────── */
(function () {
  if (!DB.getSession()) {
    window.location.href = 'index.html';
  }
})();

/* ─── State Initialization ───────────────────────────────────────── */
const _currentUser  = DB.getCurrentUser();
window._state       = DB.getUserState(_currentUser);
window._lang        = window._state.language || 'ru';
window._isLight     = window._state.theme === 'light';

/* ─── Add-expense scratch vars ───────────────────────────────────── */
window._addAmount  = '';
window._addCat     = '';
window._addComment = '';

let _activeTab      = 'home';
const _TAB_ORDER    = ['home', 'week', 'add', 'lessons', 'profile'];

/* ─── Persist ────────────────────────────────────────────────────── */
function saveState() {
  DB.saveUserState(_currentUser, window._state);
}

/* ─── Domain Helpers ─────────────────────────────────────────────── */
function getWeekExpenses() {
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  return window._state.expenses.filter(e => new Date(e.date) >= weekAgo);
}
function getTotalWeek() {
  return getWeekExpenses().reduce((s, e) => s + e.amount, 0);
}
function getLevel() {
  const c = window._state.coins;
  let idx = 0;
  LEVELS.forEach((l, i) => { if (c >= l.min) idx = i; });
  return { ...LEVELS[idx], name: LANGS[window._lang].levels[idx], idx };
}
function getLevelPct() {
  const lv = getLevel();
  if (lv.max === Infinity) return 100;
  return Math.round(((window._state.coins - lv.min) / (lv.max - lv.min)) * 100);
}

/* ─── Theme ──────────────────────────────────────────────────────── */
function toggleTheme() {
  window._isLight      = !window._isLight;
  window._state.theme  = window._isLight ? 'light' : 'dark';
  saveState();
  applyTheme();
}
function applyTheme() {
  document.body.classList.toggle('light-mode', window._isLight);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = `<i class="ti ti-${window._isLight ? 'moon' : 'sun'}"></i>`;
}

/* ─── Language Modal ─────────────────────────────────────────────── */
function openLangModal() {
  const m  = document.getElementById('lang-modal');
  m.style.display = 'flex';
  const L  = LANGS[window._lang];
  document.getElementById('lang-modal-title').textContent = L.lang_title;
  document.getElementById('lang-cancel').textContent      = L.lang_cancel;
  const lst = document.getElementById('lang-list');
  lst.innerHTML = '';
  Object.entries(LANGS).forEach(([k, v]) => {
    const d = document.createElement('div');
    d.className = 'lang-opt' + (k === window._lang ? ' sel' : '');
    d.innerHTML = `<span class="lang-flag">${v.flag}</span><span class="lang-name">${v.name}</span>
      ${k === window._lang ? '<i class="ti ti-check" style="margin-left:auto;color:var(--accent)"></i>' : ''}`;
    d.onclick = () => {
      window._lang = k;
      window._state.language = k;
      saveState();
      closeLangModal();
      render();
    };
    lst.appendChild(d);
  });
}
function closeLangModal() {
  document.getElementById('lang-modal').style.display = 'none';
}

/* ─── Toast ──────────────────────────────────────────────────────── */
function showToast(msg) {
  const a = document.getElementById('toast-area');
  const d = document.createElement('div');
  d.className   = 'toast';
  d.textContent = msg;
  a.appendChild(d);
  setTimeout(() => d.remove(), 2500);
}

/* ─── Achievements ───────────────────────────────────────────────── */
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!window._state.unlockedAchievements.includes(a.id) && a.cond(window._state)) {
      window._state.unlockedAchievements = [...window._state.unlockedAchievements, a.id];
      const nm = (LANGS[window._lang].ach || {})[a.id];
      showToast(`🏆 ${nm ? nm.t : 'Achievement'}!`);
    }
  });
}

/* ─── Add Expense ────────────────────────────────────────────────── */
function addExpense(exp) {
  const today = new Date().toDateString();
  const last  = window._state.lastEntryDate
    ? new Date(window._state.lastEntryDate).toDateString()
    : null;
  let ns = window._state.streak;
  if (last !== today) {
    const yest = new Date(Date.now() - 864e5).toDateString();
    ns = (last === yest || !last) ? window._state.streak + 1 : 1;
  }
  window._state.expenses = [
    ...window._state.expenses,
    { ...exp, id: Date.now(), date: new Date().toISOString() }
  ];
  window._state.totalEntries++;
  window._state.streak        = ns;
  window._state.lastEntryDate = new Date().toISOString();
  window._state.coins        += 10;
  checkAchievements();
  saveState();
}

/* ─── Delete Expense ─────────────────────────────────────────────── */
function deleteExpense(id) {
  const row = document.getElementById('exp-' + id);
  if (row) {
    row.style.transition = 'all .25s';
    row.style.opacity    = '0';
    row.style.transform  = 'translateX(20px)';
    setTimeout(() => {
      window._state.expenses = window._state.expenses.filter(e => e.id !== id);
      window._state.totalEntries = Math.max(0, window._state.totalEntries - 1);
      saveState();
      render();
    }, 250);
  }
}

/* ─── Navigation ─────────────────────────────────────────────────── */
function goTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + tab);
  if (nb) nb.classList.add('active');
  render();
  const c = document.getElementById('main-content');
  if (c) c.scrollTop = 0;
}

/* ─── Render ─────────────────────────────────────────────────────── */
function render() {
  applyTheme();
  const L = LANGS[window._lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (L[k]) el.textContent = L[k];
  });
  const c = document.getElementById('main-content');
  if (!c) return;
  if      (_activeTab === 'home')    c.innerHTML = renderHome();
  else if (_activeTab === 'add')     c.innerHTML = renderAdd();
  else if (_activeTab === 'week')    c.innerHTML = renderWeek();
  else if (_activeTab === 'lessons') c.innerHTML = renderLessons();
  else if (_activeTab === 'profile') c.innerHTML = renderProfile();
  attachHandlers();
}

/* ─── Event Handlers ─────────────────────────────────────────────── */
function attachHandlers() {
  /* Auto-focus comment field on Add tab */
  if (_activeTab === 'add') {
    const ci = document.getElementById('commentInput');
    if (ci) ci.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSave();
    });
  }

  /* Budget input: save on Enter */
  const bi = document.getElementById('budgetInput');
  if (bi) bi.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveBudget();
  });
}

/* ─── Swipe Navigation ───────────────────────────────────────────── */
(function () {
  let _tx = 0, _ty = 0;
  const TABS_NO_ADD = ['home', 'week', 'lessons', 'profile'];

  document.addEventListener('touchstart', e => {
    _tx = e.touches[0].clientX;
    _ty = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (_activeTab === 'add') return;                  // no swipe on numpad
    const dx = e.changedTouches[0].clientX - _tx;
    const dy = e.changedTouches[0].clientY - _ty;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;

    const cur = TABS_NO_ADD.indexOf(_activeTab);
    if (cur === -1) return;
    const next = dx < 0
      ? TABS_NO_ADD[Math.min(cur + 1, TABS_NO_ADD.length - 1)]
      : TABS_NO_ADD[Math.max(cur - 1, 0)];

    if (next !== _activeTab) goTab(next);
  }, { passive: true });
})();

/* ─── History Filter ─────────────────────────────────────────────── */
window._histFilter = 'all';

function filterHistory(catId) {
  window._histFilter = catId;

  /* Update chip styles */
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === catId);
  });

  const L       = LANGS[window._lang];
  const allExp  = catId === 'all'
    ? [...window._state.expenses].reverse()
    : [...window._state.expenses].filter(e => e.category === catId).reverse();

  const list = document.getElementById('historyList');
  if (!list) return;

  if (allExp.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text3)">
      <i class="ti ti-receipt-off" style="font-size:32px;display:block;margin-bottom:8px;opacity:.5"></i>
      ${L.no_expenses}
    </div>`;
    return;
  }

  const grouped = {};
  allExp.forEach(e => {
    const dk = new Date(e.date).toLocaleDateString(
      window._lang === 'ru' ? 'ru-RU' : window._lang === 'kz' ? 'kk-KZ' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
    if (!grouped[dk]) grouped[dk] = [];
    grouped[dk].push(e);
  });

  list.innerHTML = Object.entries(grouped).map(([date, exps]) => `
    <div class="history-date-group">${date}</div>
    <div class="card" style="padding:4px 12px;margin-bottom:8px">
      ${exps.map(e => _expenseRow(e, L, true)).join('')}
    </div>`).join('');
}

/* ─── Numpad ─────────────────────────────────────────────────────── */
function numKey(k) {
  let a = window._addAmount || '';
  if (k === 'del')       a = a.slice(0, -1);
  else if (k === '.')  { if (!a.includes('.') && a.length < 9) a += k; }
  else if (a.length < 9) a += k;
  window._addAmount = a;
  const d = document.getElementById('amountDisplay');
  if (d) {
    d.textContent = a ? `${a} ₸` : '0 ₸';
    d.className   = 'amount-num' + (a ? '' : ' placeholder');
  }
  const sb = document.getElementById('saveBtn');
  if (sb) sb.disabled = !a || !window._addCat;
}

function selCat(id) {
  window._addCat = id;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('sel'));
  const idx = CATEGORIES.findIndex(c => c.id === id);
  const all = document.querySelectorAll('.cat-btn');
  if (all[idx]) all[idx].classList.add('sel');
  const sb = document.getElementById('saveBtn');
  if (sb) sb.disabled = !window._addAmount;
}

function doSave() {
  const a = parseFloat((window._addAmount || '').replace(',', '.'));
  if (!a || !window._addCat) return;
  addExpense({ amount: a, category: window._addCat, comment: (window._addComment || '').trim() });
  window._addAmount = ''; window._addCat = ''; window._addComment = '';
  const L = LANGS[window._lang];
  showToast(`✓ ${L.saved} ${L.coins_earned}`);
  goTab('home');
}

/* ─── Budget ─────────────────────────────────────────────────────── */
function toggleBudgetEdit() {
  const d    = document.getElementById('budgetDisplay');
  const e    = document.getElementById('budgetEdit');
  const b    = document.getElementById('editBudgetBtn');
  const edit = e.style.display !== 'none';
  d.style.display      = edit ? 'block' : 'none';
  e.style.display      = edit ? 'none'  : 'flex';
  e.style.flexDirection = 'column';
  b.textContent = edit ? LANGS[window._lang].edit : LANGS[window._lang].cancel;
  if (!edit) document.getElementById('budgetInput')?.focus();
}
function cancelBudget()  { toggleBudgetEdit(); }
function saveBudget() {
  const v = parseInt(document.getElementById('budgetInput')?.value);
  if (!isNaN(v) && v > 0) {
    window._state.weeklyBudget = v;
    saveState();
    showToast(LANGS[window._lang].budget_updated);
    toggleBudgetEdit();
    render();
  }
}

/* ─── Reset ──────────────────────────────────────────────────────── */
function doReset() {
  if (confirm(LANGS[window._lang].reset_confirm)) {
    window._state = DB.resetUserState(_currentUser);
    render();
  }
}

/* ─── Logout ─────────────────────────────────────────────────────── */
function doLogout() {
  DB.logout();
  window.location.href = 'index.html';
}

/* ─── Lesson Modal ───────────────────────────────────────────────── */
function openLesson(id) {
  const lesson = LESSON_DATA[id];
  if (!lesson) return;
  const lk   = window._lang;
  const done = window._state.lessonProgress && window._state.lessonProgress[id];
  const L    = LANGS[lk];

  const overlay = document.createElement('div');
  overlay.className = 'lesson-modal-overlay';
  overlay.id        = 'lessonOverlay';

  overlay.innerHTML = `
    <div class="lesson-modal">
      <div class="modal-handle"></div>
      <div class="lesson-modal-header">
        <div class="lesson-modal-ico" style="background:${lesson.bg}">
          <i class="ti ${lesson.icon}" style="color:${lesson.color};font-size:24px"></i>
        </div>
        <div>
          <div class="lesson-modal-title">${lesson.title[lk] || lesson.title.ru}</div>
          <div class="lesson-modal-desc">${lesson.desc[lk] || lesson.desc.ru}</div>
        </div>
      </div>

      ${lesson.steps.map((step, i) => `
        <div class="lesson-step">
          <div class="lesson-step-num">${i + 1}</div>
          <div class="lesson-step-text">${step[lk] || step.ru}</div>
        </div>`).join('')}

      <div class="lesson-tip">
        <div>${lesson.tip[lk] || lesson.tip.ru}</div>
      </div>

      <button class="lesson-complete-btn ${done ? 'done' : 'not-done'}"
        id="lessonCompleteBtn" onclick="completeLesson('${id}')">
        <i class="ti ti-${done ? 'circle-check' : 'check'}"></i>
        ${done
          ? (lk === 'ru' ? 'Пройдено' : lk === 'kz' ? 'Аяқталды' : 'Completed')
          : (lk === 'ru' ? 'Отметить как пройденное' : lk === 'kz' ? 'Өтілді деп белгілеу' : 'Mark as completed')}
      </button>
      <button class="btn-secondary" style="margin-top:8px" onclick="closeLesson()">
        ${L.cancel}
      </button>
    </div>`;

  /* close on overlay click */
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeLesson();
  });

  document.body.appendChild(overlay);
}

function closeLesson() {
  const overlay = document.getElementById('lessonOverlay');
  if (overlay) overlay.remove();
}

function completeLesson(id) {
  if (!window._state.lessonProgress) window._state.lessonProgress = {};
  const wasNew = !window._state.lessonProgress[id];
  window._state.lessonProgress[id] = true;

  if (wasNew) {
    window._state.lessonsCompleted = Object.values(window._state.lessonProgress).filter(Boolean).length;
    window._state.coins += 30;
    checkAchievements();
    saveState();
    const lk = window._lang;
    showToast(lk === 'ru' ? '🎓 Урок пройден! +30 монет' : lk === 'kz' ? '🎓 Сабақ аяқталды! +30 тиын' : '🎓 Lesson completed! +30 coins');
  }

  /* Update button in modal without closing */
  const btn = document.getElementById('lessonCompleteBtn');
  if (btn) {
    const lk = window._lang;
    btn.className = 'lesson-complete-btn done';
    btn.innerHTML = `<i class="ti ti-circle-check"></i>
      ${lk === 'ru' ? 'Пройдено' : lk === 'kz' ? 'Аяқталды' : 'Completed'}`;
  }
}

/* ─── Streaming AI Report ────────────────────────────────────────── */
async function getAiReport() {
  const L   = LANGS[window._lang];
  const we  = getWeekExpenses();
  const wt  = getTotalWeek();
  const btn = document.getElementById('ai-btn-text');
  const ar  = document.getElementById('ai-result');

  if (btn) btn.textContent = L.loading;

  if (ar) ar.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:44px;height:44px;border-radius:var(--r2);background:var(--purple-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="ti ti-sparkles" style="color:var(--purple);font-size:22px"></i>
        </div>
        <div>
          <div style="font-weight:700">${L.ai_report}</div>
          <div id="stream-status" style="font-size:12px;color:var(--text3)">${L.loading}</div>
        </div>
      </div>
      <div style="display:flex;gap:7px;align-items:center;justify-content:center;padding:16px 0">
        <div class="stream-dot"></div>
        <div class="stream-dot" style="animation-delay:.15s"></div>
        <div class="stream-dot" style="animation-delay:.3s"></div>
      </div>
    </div>`;

  const expSum = CATEGORIES.map(cat => {
    const tot = we.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0);
    return tot ? `${L.cats[cat.id]}: ${fmoney(tot)}` : '';
  }).filter(Boolean).join(', ');

  const systemPrompt = [
    'You are a personal finance advisor.',
    'Answer ONLY in valid JSON — no markdown fences, no preamble:',
    '{"score":1-10,"summary":"2 sentences","tips":["tip1","tip2","tip3"],"praise":"short positive note"}',
    `Language: ${window._lang === 'ru' ? 'Russian' : window._lang === 'kz' ? 'Kazakh' : 'English'}`,
  ].join('\n');

  const userMsg = [
    `Weekly expenses: ${expSum || 'None'}`,
    `Total: ${fmoney(wt)}`,
    `Budget: ${fmoney(window._state.weeklyBudget)}`,
    `Budget used: ${Math.round(wt / window._state.weeklyBudget * 100)}%`,
  ].join('\n');

  let fullText   = '';
  let tokenCount = 0;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 800,
        stream:     true,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMsg }],
      }),
    });

    if (!res.ok) throw new Error('API ' + res.status);

    /* ── SSE stream ────────────────────────────────────────────── */
    if (res.body?.getReader) {
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
              fullText   += ev.delta.text;
              tokenCount++;
              const st = document.getElementById('stream-status');
              if (st) st.textContent = `${L.loading} ${tokenCount}…`;
            }
          } catch { /* skip malformed SSE line */ }
        }
      }
    } else {
      /* fallback: non-streaming */
      const d  = await res.json();
      fullText = d.content.map(b => b.text || '').join('');
    }

    /* ── Parse ─────────────────────────────────────────────────── */
    const j     = JSON.parse(fullText.replace(/```json|```/g, '').trim());
    const score = Math.max(1, Math.min(10, Number(j.score) || 5));

    if (ar) ar.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:44px;height:44px;border-radius:var(--r2);background:var(--purple-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="ti ti-sparkles" style="color:var(--purple);font-size:22px"></i>
          </div>
          <div>
            <div style="font-weight:700">${L.ai_report}</div>
            <div style="font-size:13px;color:var(--amber)">
              ${'★'.repeat(score)}${'☆'.repeat(10 - score)}
              <span style="color:var(--text3);font-size:11px;margin-left:4px">${score}/10</span>
            </div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.6">${j.summary}</p>
        ${j.praise ? `
          <div style="padding:8px 12px;background:var(--green-bg);border-radius:var(--r);font-size:12px;color:var(--green);margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <i class="ti ti-thumb-up" style="flex-shrink:0"></i> ${j.praise}
          </div>` : ''}
        <div>
          ${(j.tips || []).map((tip, i) => `
            <div style="display:flex;gap:10px;padding:8px 0;font-size:12px;color:var(--text2);${i < j.tips.length - 1 ? 'border-bottom:1px solid var(--border)' : ''};line-height:1.5">
              <span style="color:var(--accent);font-weight:800;flex-shrink:0">${i + 1}.</span>${tip}
            </div>`).join('')}
        </div>
      </div>`;

  } catch (err) {
    console.error('AI report error:', err);
    if (ar) ar.innerHTML = `
      <div class="card" style="text-align:center;color:var(--text3);padding:20px">
        <i class="ti ti-wifi-off" style="font-size:28px;display:block;margin-bottom:8px"></i>
        ${window._lang === 'kz' ? 'Жүктеу қатесі' : window._lang === 'ru' ? 'Ошибка загрузки' : 'Loading error'}
      </div>`;
  } finally {
    if (btn) btn.textContent = LANGS[window._lang].get_report;
  }
}

/* ─── Boot ───────────────────────────────────────────────────────── */
applyTheme();
render();
