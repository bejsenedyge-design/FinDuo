/**
 * FinTrack UI Renderers
 * Each function returns an HTML string injected into #main-content.
 * Depends on: config.js, i18n.js, app.js globals
 */

/* ═══════════════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════════════ */
function renderHome() {
  const L = LANGS[window._lang];
  const we = getWeekExpenses();
  const wt = getTotalWeek();
  const bpct = Math.min(100, Math.round(wt / window._state.weeklyBudget * 100));
  const todayStr = new Date().toDateString();
  const todayExps = window._state.expenses.filter(e => new Date(e.date).toDateString() === todayStr);
  const todayTotal = todayExps.reduce((s, e) => s + e.amount, 0);
  const enteredToday = todayExps.length > 0;
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const ds = d.toDateString();
    const has = window._state.expenses.some(e => new Date(e.date).toDateString() === ds);
    return { day: L.dayNames[d.getDay()], has, isToday: ds === todayStr };
  });
  const recent = [...window._state.expenses].reverse().slice(0, 4);
  const bcolor = bpct >= 80 ? 'var(--red)' : bpct >= 60 ? 'var(--amber)' : 'var(--green)';

  return `
  <div class="hero-card">
    <div style="position:relative;z-index:1">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.6)">
          ${enteredToday
            ? `<i class="ti ti-circle-check" style="color:rgba(255,255,255,0.8)"></i> ${L.greeting_done}`
            : L.greeting_empty}
        </span>
        <span class="tag" style="background:rgba(255,255,255,0.15);color:white;font-size:11px">
          <i class="ti ti-flame"></i> ${window._state.streak} ${L.days}
        </span>
      </div>
      <div style="font-size:34px;font-weight:800;color:white;letter-spacing:-1px;margin:4px 0">
        ${enteredToday ? fmoney(todayTotal) : fmoney(wt)}
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.55)">
        ${enteredToday ? L.today : L.week_budget}
      </div>
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-weight:700;font-size:13px">
        <i class="ti ti-calendar-week" style="color:var(--accent);margin-right:6px"></i>${L.week_activity}
      </span>
    </div>
    <div class="week-dots">
      ${weekDays.map(d => `
        <div class="day-dot-wrap">
          <div class="day-dot ${d.has ? 'done' : d.isToday ? 'today' : 'empty'}">
            ${d.has
              ? '<i class="ti ti-check" style="font-size:13px"></i>'
              : d.isToday
                ? '<i class="ti ti-circle" style="font-size:11px"></i>'
                : '<i class="ti ti-minus" style="font-size:10px"></i>'}
          </div>
          <div class="day-label">${d.day}</div>
        </div>`).join('')}
    </div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-weight:700;font-size:13px">
        <i class="ti ti-wallet" style="color:var(--accent);margin-right:6px"></i>${L.week_budget}
      </span>
      <span style="font-size:12px;font-weight:700;color:${bcolor}">${bpct}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${bpct}%;background:${bcolor}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-top:4px">
      <span>${fmoney(wt)}</span><span>${fmoney(window._state.weeklyBudget)}</span>
    </div>
    ${bpct >= 80 ? `
      <div style="margin-top:10px;padding:8px 12px;background:var(--red-bg);border-radius:var(--r);font-size:12px;font-weight:600;color:var(--red);display:flex;align-items:center;gap:6px">
        <i class="ti ti-alert-triangle"></i>${L.budget_warn}
      </div>` : ''}
  </div>

  <button class="btn-primary" onclick="goTab('add')" style="margin-bottom:16px">
    <i class="ti ti-plus"></i> ${L.add_expense}
  </button>

  ${recent.length ? `
    <div class="section-title">${L.recent}</div>
    <div class="card">
      ${recent.map(e => _expenseRow(e, L, false)).join('')}
      ${window._state.expenses.length > 4 ? `
        <button class="btn-secondary" style="margin-top:10px;padding:10px" onclick="goTab('week')">
          ${L.show_all}
        </button>` : ''}
    </div>
  ` : `
    <div class="card" style="text-align:center;padding:30px;color:var(--text3)">
      <i class="ti ti-receipt-off" style="font-size:36px;display:block;margin-bottom:8px;opacity:.5"></i>
      ${L.no_expenses}
    </div>`}
  `;
}

/* ─── Shared expense row helper ──────────────────────────────────── */
function _expenseRow(e, L, deletable) {
  const cat = CATEGORIES.find(c => c.id === e.category) || CATEGORIES[6];
  const nm  = L.cats[e.category] || e.category;
  return `
    <div class="expense-row" id="exp-${e.id}">
      <div class="cat-icon" style="background:${cat.bg}">
        <i class="ti ${cat.icon}" style="color:${cat.color};font-size:20px"></i>
      </div>
      <div style="min-width:0;flex:1">
        <div class="exp-name">${e.comment || nm}</div>
        <div class="exp-date">${fdate(e.date)}</div>
      </div>
      <div class="exp-amount" style="color:var(--red)">−${fmoney(e.amount)}</div>
      ${deletable ? `
        <button class="exp-row-del" onclick="deleteExpense(${e.id})" title="Удалить">
          <i class="ti ti-trash" style="font-size:13px"></i>
        </button>` : ''}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   ADD EXPENSE
═══════════════════════════════════════════════════════════════════ */
function renderAdd() {
  const L   = LANGS[window._lang];
  const amt = window._addAmount || '';
  const cat = window._addCat   || '';
  return `
  <div style="padding-top:4px">
    <div style="font-size:18px;font-weight:700;margin-bottom:16px">${L.new_expense}</div>

    <div class="amount-display">
      <div class="label">${L.amount}</div>
      <div class="amount-num${!amt ? ' placeholder' : ''}" id="amountDisplay">
        ${amt ? `${amt} ₸` : '0 ₸'}
      </div>
    </div>

    <div class="numpad">
      ${['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => `
        <button class="numpad-key${k === 'del' ? ' del' : ''}" onclick="numKey('${k}')">
          ${k === 'del' ? '<i class="ti ti-backspace"></i>' : k}
        </button>`).join('')}
    </div>

    <div style="font-weight:700;font-size:13px;color:var(--text2);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">
      ${L.category}
    </div>
    <div class="cat-grid" id="catGrid">
      ${CATEGORIES.map(c => `
        <button class="cat-btn${cat === c.id ? ' sel' : ''}" onclick="selCat('${c.id}')">
          <i class="ti ${c.icon}" style="color:${c.color}"></i>
          <span>${L.cats[c.id]}</span>
        </button>`).join('')}
    </div>

    <div style="margin:16px 0">
      <div style="font-weight:700;font-size:13px;color:var(--text2);margin-bottom:8px">${L.comment}</div>
      <input class="input-field" id="commentInput"
        placeholder="${L.comment_hint}"
        value="${window._addComment || ''}"
        oninput="window._addComment=this.value">
    </div>

    <button class="btn-primary" id="saveBtn" onclick="doSave()" ${!amt || !cat ? 'disabled' : ''}>
      <i class="ti ti-check"></i> ${L.save}
    </button>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   ANALYTICS  (includes full history list)
═══════════════════════════════════════════════════════════════════ */
function renderWeek() {
  const L   = LANGS[window._lang];
  const we  = getWeekExpenses();
  const wt  = getTotalWeek();
  const byCat = CATEGORIES
    .map(cat => ({ ...cat, tot: we.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.tot > 0);
  const today = new Date();
  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const ds  = d.toDateString();
    const tot = we.filter(e => new Date(e.date).toDateString() === ds).reduce((s, e) => s + e.amount, 0);
    return { day: L.dayNames[d.getDay()], tot, isToday: ds === today.toDateString() };
  });
  const maxBar    = Math.max(...barData.map(b => b.tot), 1);
  const remaining = Math.max(0, window._state.weeklyBudget - wt);

  /* ─ Full history grouped by date ─ */
  const allExp  = [...window._state.expenses].reverse();
  const grouped = {};
  allExp.forEach(e => {
    const dk = new Date(e.date).toLocaleDateString(
      window._lang === 'ru' ? 'ru-RU' : window._lang === 'kz' ? 'kk-KZ' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
    if (!grouped[dk]) grouped[dk] = [];
    grouped[dk].push(e);
  });

  const historyHTML = Object.keys(grouped).length === 0
    ? `<div style="text-align:center;padding:24px;color:var(--text3)">
         <i class="ti ti-receipt-off" style="font-size:32px;display:block;margin-bottom:8px;opacity:.5"></i>
         ${L.no_expenses}
       </div>`
    : Object.entries(grouped).map(([date, exps]) => `
        <div class="history-date-group">${date}</div>
        <div class="card" style="padding:4px 12px;margin-bottom:8px">
          ${exps.map(e => _expenseRow(e, L, true)).join('')}
        </div>`).join('');

  /* ─ Category filter chips ─ */
  const chips = [
    { id: 'all', label: window._lang === 'ru' ? 'Все' : window._lang === 'kz' ? 'Барлығы' : 'All' },
    ...CATEGORIES.map(c => ({ id: c.id, label: L.cats[c.id] })),
  ];

  return `
  <div style="font-size:18px;font-weight:700;margin-bottom:16px">${L.analytics}</div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--accent-bg)">
        <i class="ti ti-wallet" style="color:var(--accent)"></i>
      </div>
      <div class="stat-val">${fmoney(wt)}</div>
      <div class="stat-lbl">${L.spent}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--green-bg)">
        <i class="ti ti-trending-down" style="color:var(--green)"></i>
      </div>
      <div class="stat-val">${fmoney(remaining)}</div>
      <div class="stat-lbl">${L.remaining || 'Осталось'}</div>
    </div>
  </div>

  <div class="card">
    <div style="font-weight:700;font-size:13px;margin-bottom:12px">
      <i class="ti ti-chart-bar" style="color:var(--accent);margin-right:6px"></i>${L.by_day}
    </div>
    <div class="bar-chart">
      ${barData.map(b => `
        <div class="bar-col">
          <div class="bar"
            style="height:${Math.round(b.tot / maxBar * 72)}px;min-height:${b.tot ? 4 : 0}px;
              background:${b.isToday ? 'var(--accent)' : b.tot ? 'var(--accent-bg)' : 'var(--bg4)'};
              border:1px solid ${b.isToday ? 'var(--accent)' : 'transparent'}">
          </div>
          <div class="bar-lbl">${b.day}</div>
        </div>`).join('')}
    </div>
  </div>

  ${byCat.length ? `
    <div class="card">
      <div style="font-weight:700;font-size:13px;margin-bottom:12px">
        <i class="ti ti-chart-pie" style="color:var(--accent);margin-right:6px"></i>${L.by_category}
      </div>
      ${byCat.map(cat => {
        const pct = Math.round(cat.tot / wt * 100);
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:28px;height:28px;border-radius:6px;background:${cat.bg};display:flex;align-items:center;justify-content:center">
                <i class="ti ${cat.icon}" style="color:${cat.color};font-size:14px"></i>
              </div>
              <span style="font-size:13px;font-weight:600">${L.cats[cat.id]}</span>
            </div>
            <span style="font-size:12px;font-weight:700">${fmoney(cat.tot)}</span>
          </div>
          <div class="progress-track" style="height:5px">
            <div class="progress-fill" style="width:${pct}%;background:${cat.color}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

  <button class="btn-primary"
    style="background:linear-gradient(135deg,var(--purple),var(--accent));margin-bottom:20px"
    onclick="getAiReport()">
    <i class="ti ti-sparkles"></i>
    <span id="ai-btn-text">${L.get_report}</span>
  </button>
  <div id="ai-result" style="margin-bottom:12px"></div>

  <!-- Full History -->
  <div style="font-size:15px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:8px">
    <i class="ti ti-history" style="color:var(--accent)"></i>
    ${window._lang === 'ru' ? 'История' : window._lang === 'kz' ? 'Тарих' : 'History'}
    <span style="font-size:12px;font-weight:600;color:var(--text3);margin-left:auto">
      ${window._state.expenses.length} ${window._lang === 'ru' ? 'записей' : window._lang === 'kz' ? 'жазба' : 'entries'}
    </span>
  </div>

  <div class="history-filter" id="histFilter">
    ${chips.map(c => `
      <button class="filter-chip${c.id === 'all' ? ' active' : ''}"
        data-filter="${c.id}" onclick="filterHistory('${c.id}')">
        ${c.id !== 'all' ? `<i class="ti ${CATEGORIES.find(x=>x.id===c.id)?.icon}" style="font-size:11px;margin-right:3px"></i>` : ''}
        ${c.label}
      </button>`).join('')}
  </div>

  <div id="historyList">${historyHTML}</div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   LESSONS
═══════════════════════════════════════════════════════════════════ */
const LESSON_DATA = {
  budgeting: {
    icon:'ti-calculator', color:'var(--green)', bg:'var(--green-bg)',
    title:{ ru:'Основы бюджета', en:'Budgeting Basics', kz:'Бюджет негіздері' },
    desc: { ru:'Правило 50/30/20', en:'50/30/20 Rule', kz:'50/30/20 ережесі' },
    steps: [
      { ru:'<b>50%</b> дохода — на нужды: еда, аренда, транспорт, коммунальные платежи.',
        en:'<b>50%</b> of income goes to needs: food, rent, transport, utilities.',
        kz:'Табыстың <b>50%</b> — қажеттіліктерге: тамақ, жалдау, көлік.' },
      { ru:'<b>30%</b> — на желания: кафе, развлечения, одежда сверх необходимого.',
        en:'<b>30%</b> — wants: cafes, entertainment, non-essential clothes.',
        kz:'<b>30%</b> — тілектер: кафе, ойын-сауық, қажетсіз киім.' },
      { ru:'<b>20%</b> — в накопления и погашение долгов. Это неприкосновенный запас.',
        en:'<b>20%</b> — savings and debt repayment. This is untouchable.',
        kz:'<b>20%</b> — жинақтар мен қарыздарды өтеу. Бұл тиіспеу керек.' },
      { ru:'Отслеживай расходы каждую неделю — именно это делает FinTrack за тебя.',
        en:'Track spending every week — that is exactly what FinTrack does for you.',
        kz:'Апта сайын шығындарды бақыла — FinTrack мұны сенің орныңа жасайды.' },
    ],
    tip: {
      ru:'💡 Начни с малого: запиши все расходы за одну неделю, чтобы понять свою структуру трат.',
      en:'💡 Start small: track all spending for one week to understand your spending patterns.',
      kz:'💡 Кішіден бастаңыз: бір апта ішіндегі барлық шығындарды жазып, үлгілеріңізді түсіне алыңыз.',
    },
  },
  emergency: {
    icon:'ti-shield-check', color:'var(--accent)', bg:'var(--accent-bg)',
    title:{ ru:'Подушка безопасности', en:'Emergency Fund', kz:'Қауіпсіздік жастығы' },
    desc: { ru:'Финансовая защита', en:'Financial protection', kz:'Қаржылық қорғаныс' },
    steps: [
      { ru:'Подушка безопасности — это <b>3–6 месячных расходов</b> на отдельном счёте.',
        en:'An emergency fund is <b>3–6 months of expenses</b> in a separate account.',
        kz:'Қауіпсіздік жастығы — жеке шотта <b>3–6 айлық шығын</b>.' },
      { ru:'Откладывай <b>минимум 10%</b> каждого дохода до тех пор, пока не наберёшь нужную сумму.',
        en:'Save <b>at least 10%</b> of every income until you reach the target amount.',
        kz:'Қажетті сомаға жеткенше, әрбір табыстан <b>кемінде 10%</b> бөліп отырыңыз.' },
      { ru:'Используй только в настоящих чрезвычайных ситуациях: потеря работы, болезнь, крупная поломка.',
        en:'Use only in real emergencies: job loss, illness, major breakdown.',
        kz:'Тек нақты төтенше жағдайларда: жұмыс жоғалту, ауру, ірі авария.' },
      { ru:'После использования — сразу восполняй, как только стабилизируется ситуация.',
        en:'After using — replenish as soon as the situation stabilises.',
        kz:'Пайдаланғаннан кейін — жағдай тұрақтанған бойда толықтырыңыз.' },
    ],
    tip: {
      ru:'💡 Держи подушку на отдельном накопительном счёте, чтобы не тратить случайно.',
      en:'💡 Keep the fund in a separate savings account so you do not spend it by accident.',
      kz:'💡 Жастықты жеке жинақ шотта ұстаңыз, кездейсоқ жұмсап алмайсыз.',
    },
  },
  investments: {
    icon:'ti-trending-up', color:'var(--amber)', bg:'var(--amber-bg)',
    title:{ ru:'Инвестиции', en:'Investments', kz:'Инвестициялар' },
    desc: { ru:'Деньги работают', en:'Make money work', kz:'Ақша жұмыс істейді' },
    steps: [
      { ru:'Инвестировать можно только <b>свободные деньги</b> — после расходов и подушки безопасности.',
        en:'Invest only <b>free money</b> — after expenses and emergency fund.',
        kz:'Тек <b>бос ақшаны</b> салыңыз — шығындар мен қауіпсіздік жастығынан кейін.' },
      { ru:'Самый простой старт — <b>банковский депозит</b>. Минимальный риск, гарантированный процент.',
        en:'The simplest start — <b>a bank deposit</b>. Minimum risk, guaranteed rate.',
        kz:'Ең қарапайым бастама — <b>банк депозиті</b>. Тәуекел аз, пайыз кепілді.' },
      { ru:'Следующий уровень — <b>индексные фонды (ETF)</b>. Диверсификация с минимальными комиссиями.',
        en:'The next level — <b>index funds (ETF)</b>. Diversification with low fees.',
        kz:'Келесі деңгей — <b>индекстік қорлар (ETF)</b>. Комиссиясы аз диверсификация.' },
      { ru:'Главное правило: <b>не вкладывай то, что боишься потерять</b>. Любой актив может упасть.',
        en:'Key rule: <b>never invest what you cannot afford to lose</b>. Any asset can fall.',
        kz:'Негізгі ереже: <b>жоғалтудан қорқатын нәрсені салма</b>. Кез келген актив түсуі мүмкін.' },
    ],
    tip: {
      ru:'💡 Сложный процент работает со временем: даже небольшие регулярные вложения дают большой результат через 10–20 лет.',
      en:'💡 Compound interest works over time: even small regular investments yield big results in 10–20 years.',
      kz:'💡 Күрделі пайыз уақытпен жұмыс істейді: кішкентай тұрақты салымдар 10–20 жылдан кейін үлкен нәтиже береді.',
    },
  },
  debts: {
    icon:'ti-scale', color:'var(--purple)', bg:'var(--purple-bg)',
    title:{ ru:'Управление долгами', en:'Debt Management', kz:'Қарыздарды басқару' },
    desc: { ru:'Выйди из долгов', en:'Get out of debt', kz:'Қарыздан шығу' },
    steps: [
      { ru:'Составь список всех долгов: сумма, процентная ставка, минимальный платёж.',
        en:'List all debts: amount, interest rate, minimum payment.',
        kz:'Барлық қарыздарды тізімдеңіз: сома, пайыздық мөлшерлеме, ең аз төлем.' },
      { ru:'<b>Метод лавины</b>: погашай сначала долг с наивысшей ставкой — так сэкономишь больше всего.',
        en:'<b>Avalanche method</b>: pay off the highest-rate debt first — maximum savings.',
        kz:'<b>Көшкін әдісі</b>: алдымен ең жоғары мөлшерлемедегі қарызды өтеңіз — жинаудың ең жақсы жолы.' },
      { ru:'<b>Метод снежного кома</b>: сначала маленький долг — для психологической победы и мотивации.',
        en:'<b>Snowball method</b>: pay the smallest debt first — psychological win and motivation.',
        kz:'<b>Қар кесек әдісі</b>: алдымен кішкентай қарыз — психологиялық жеңіс және мотивация.' },
      { ru:'Не берии новых долгов, пока не закроешь старые. Кредитная карта — не дополнительный доход.',
        en:'Do not take new debts until old ones are closed. A credit card is not extra income.',
        kz:'Ескі қарыздарды жабасызша жаңаларын алмаңыз. Кредиттік карта — қосымша табыс емес.' },
    ],
    tip: {
      ru:'💡 Всю сумму, высвобождённую после закрытия долга, направляй на следующий — так скорость нарастает.',
      en:'💡 When a debt is closed, redirect the freed payment to the next one — the speed compounds.',
      kz:'💡 Қарыз жабылғанда бос болған соманы келесісіне бағыттаңыз — жылдамдық артады.',
    },
  },
};

function renderLessons() {
  const L  = LANGS[window._lang];
  const lk = window._lang;
  const keys = Object.keys(LESSON_DATA);

  return `
  <div style="font-size:18px;font-weight:700;margin-bottom:4px">${L.lessons}</div>
  <div style="font-size:12px;color:var(--text3);margin-bottom:16px">
    ${window._state.lessonsCompleted} ${L.of} ${keys.length} ${L.completed}
  </div>
  <div class="progress-track" style="margin-bottom:20px">
    <div class="progress-fill"
      style="width:${Math.round(window._state.lessonsCompleted / keys.length * 100)}%;background:var(--green)">
    </div>
  </div>
  ${keys.map(id => {
    const lesson = LESSON_DATA[id];
    const done   = window._state.lessonProgress && window._state.lessonProgress[id];
    return `
      <div class="lesson-card" onclick="openLesson('${id}')">
        <div class="lesson-ico" style="background:${lesson.bg}">
          <i class="ti ${lesson.icon}" style="color:${lesson.color};font-size:22px"></i>
        </div>
        <div class="lesson-info">
          <div class="lesson-title">${lesson.title[lk] || lesson.title.ru}</div>
          <div class="lesson-desc">${lesson.desc[lk] || lesson.desc.ru}</div>
        </div>
        <div class="lesson-status">
          ${done
            ? `<i class="ti ti-circle-check" style="color:var(--green);font-size:22px"></i>`
            : `<i class="ti ti-chevron-right" style="color:var(--text3);font-size:18px"></i>`}
        </div>
      </div>`;
  }).join('')}`;
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE
═══════════════════════════════════════════════════════════════════ */
function renderProfile() {
  const L   = LANGS[window._lang];
  const lv  = getLevel();
  const lvPct = getLevelPct();
  const displayName = DB.getDisplayName() || '—';

  return `
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);border-radius:var(--r3);padding:24px 20px;margin-bottom:16px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(79,110,247,.08)"></div>
    <div style="text-align:center;position:relative;z-index:1">
      <div style="width:68px;height:68px;border-radius:var(--r2);background:var(--accent-bg);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
        <i class="ti ${lv.icon}" style="color:var(--accent);font-size:30px"></i>
      </div>
      <div style="font-size:20px;font-weight:800;color:white">${lv.name}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.45);margin:2px 0">${L.hi}, ${displayName}!</div>
      <div style="font-size:12px;color:rgba(255,255,255,.5);margin:4px 0 14px">${window._state.coins} ${L.coins}</div>
      <div style="height:6px;background:rgba(255,255,255,.15);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${lvPct}%;background:var(--accent);border-radius:3px;transition:width .8s"></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:6px">${lvPct}% до следующего уровня</div>
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--amber-bg)"><i class="ti ti-coin" style="color:var(--amber)"></i></div>
      <div class="stat-val">${window._state.coins}</div>
      <div class="stat-lbl">${L.coins}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--red-bg)"><i class="ti ti-flame" style="color:var(--red)"></i></div>
      <div class="stat-val">${window._state.streak}</div>
      <div class="stat-lbl">${L.streak}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--accent-bg)"><i class="ti ti-file-text" style="color:var(--accent)"></i></div>
      <div class="stat-val">${window._state.totalEntries}</div>
      <div class="stat-lbl">${L.entries}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:var(--green-bg)"><i class="ti ti-book" style="color:var(--green)"></i></div>
      <div class="stat-val">${window._state.lessonsCompleted}</div>
      <div class="stat-lbl">${L.lessons.split(' ')[0]}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-weight:700;font-size:13px">
        <i class="ti ti-wallet" style="color:var(--accent);margin-right:6px"></i>${L.budget_setting}
      </span>
      <button onclick="toggleBudgetEdit()" id="editBudgetBtn"
        style="padding:5px 12px;border-radius:var(--r);background:var(--accent-bg);border:1px solid var(--accent);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">
        ${L.edit}
      </button>
    </div>
    <div id="budgetDisplay" style="font-size:26px;font-weight:700;color:var(--text)">${fmoney(window._state.weeklyBudget)}</div>
    <div id="budgetEdit" style="display:none;flex-direction:column;gap:8px">
      <input class="input-field" id="budgetInput" type="number" value="${window._state.weeklyBudget}" style="margin-bottom:8px">
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" style="padding:10px" onclick="cancelBudget()">${L.cancel}</button>
        <button class="btn-primary" style="padding:10px" onclick="saveBudget()">
          <i class="ti ti-check"></i> ${L.save_budget}
        </button>
      </div>
    </div>
  </div>

  <div class="section-title">
    <i class="ti ti-trophy" style="color:var(--amber);margin-right:4px"></i>${L.achievements}
  </div>
  <div class="achieve-grid" style="margin-bottom:12px">
    ${ACHIEVEMENTS.map(a => {
      const done = window._state.unlockedAchievements.includes(a.id);
      const nm   = (LANGS[window._lang].ach || {})[a.id] || { t: a.id, d: '' };
      return `<div class="achieve-card${done ? ' unlocked' : ''}">
        <div style="width:40px;height:40px;border-radius:var(--r);background:${done ? a.bg : 'var(--bg4)'};display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
          <i class="ti ${a.icon}" style="color:${done ? a.color : 'var(--text3)'};font-size:20px"></i>
        </div>
        <div class="ach-name">${nm.t}</div>
        <div class="ach-desc">${nm.d}</div>
        ${done ? `<div style="font-size:10px;font-weight:700;color:${a.color};margin-top:4px"><i class="ti ti-check"></i> ${L.unlocked}</div>` : ''}
      </div>`;
    }).join('')}
  </div>

  <div class="card" style="border-color:var(--red-bg)">
    <div style="font-weight:700;font-size:13px;color:var(--red);margin-bottom:6px">
      <i class="ti ti-alert-circle" style="margin-right:6px"></i>${L.reset}
    </div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${L.reset_warn}</div>
    <button onclick="doReset()"
      style="padding:10px 18px;background:var(--red-bg);border:1px solid var(--red);border-radius:var(--r);color:var(--red);font-weight:700;font-size:13px;cursor:pointer">
      <i class="ti ti-trash" style="margin-right:4px"></i>${L.reset_btn}
    </button>
  </div>

  <div class="card" style="border-color:var(--border2);margin-top:12px">
    <button onclick="doLogout()"
      style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:transparent;border:none;color:var(--text3);font-size:14px;font-weight:600;cursor:pointer">
      <i class="ti ti-logout" style="font-size:18px"></i>
      ${L.logout}
    </button>
  </div>`;
}
