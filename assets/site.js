/* Kote concept prototype. Plain JS, no build step. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = $('#root');
const MOB = root.classList.contains('mob');
const page = document.body.dataset.page;
const P = (f) => (MOB ? 'm-' : '') + f;

/* ---------- fit the fixed-width design to the window ---------- */
const fit = () => {
  const w = MOB ? 390 : 1440;
  let z = window.innerWidth / w;
  if (!MOB) z = Math.min(1.25, Math.max(0.5, z));
  root.style.zoom = z;
  window.__z = z;
};
fit();
addEventListener('resize', fit);
addEventListener('scroll', () => { if (window.__onScroll) window.__onScroll(scrollY / (window.__z || 1)); }, { passive: true });

/* ---------- state kept between pages ---------- */
const RT = window.KOTE_ROUTES || {};
const EXTRAS = [
  { k: 'crampons', name: 'crampons and axe', price: 40, per: true },
  { k: 'harness', name: 'harness and helmet', price: 30, per: true },
  { k: 'bag', name: 'sleeping bag', price: 40, per: true },
  { k: 'insurance', name: 'rescue insurance', price: 60, per: true },
  { k: 'tent', name: 'own tent', price: 35, per: false },
];
const DEPOSIT = 400;
const EX0 = { crampons: 0, harness: 0, bag: 0, insurance: 0, tent: 0 };
const exDefault = (k) => (k === 'hero' ? { crampons: 2, harness: 0, bag: 1, insurance: 0, tent: 0 } : Object.assign({}, EX0));
const def = { route: 'hero', dep: 1, n: 2, share: true, ex: exDefault('hero'), pay: 'deposit', terms: true, saved: {} };
let S;
try { S = Object.assign({}, def, JSON.parse(localStorage.getItem('kote') || '{}')); } catch (e) { S = Object.assign({}, def); }
if (!RT[S.route]) S.route = 'hero';
S.ex = Object.assign({}, EX0, S.ex || {});
if (typeof S.saved !== 'object' || !S.saved) S.saved = S.saved ? { hero: true } : {};
const save = () => { try { localStorage.setItem('kote', JSON.stringify(S)); } catch (e) {} };
let R = RT[S.route] || RT.hero;
const DEPS = () => R.deps;
const PRICE = () => R.price;
const dep = () => R.deps[S.dep] || R.deps[R.defdep];
const free = (i = S.dep) => 8 - R.deps[i].taken;
const eur = (v) => '€' + v.toLocaleString('en-US');
const words = ['No', 'One', 'Two', 'Three', 'Four'];
const allowed = () => EXTRAS.filter((x) => R.extras && R.extras[x.k] !== undefined);
const extrasTotal = () => allowed().reduce((a, x) => a + x.price * (S.ex[x.k] || 0), 0);
const total = () => PRICE() * S.n + extrasTotal();
const depositDue = () => (S.pay === 'full' ? total() : DEPOSIT * S.n);
const dateOf = (a) => new Date(a[0], a[1], a[2]);
const fmtDay = (dt) => dt.getDate() + ' ' + dt.toLocaleString('en-GB', { month: 'long' });
const balanceDate = (d = dep()) => { const t = dateOf(d.start); t.setDate(t.getDate() - 56); return fmtDay(t); };
const MAXN = () => Math.min(4, free());
/* switch the booking in progress to another route */
const useRoute = (k) => {
  if (!RT[k] || S.route === k) return;
  S.route = k; R = RT[k]; S.dep = R.defdep; S.ex = exDefault(k);
  if (S.n > MAXN()) S.n = Math.max(1, MAXN());
};
if (!R.deps[S.dep] || free() < 1) S.dep = R.defdep;
if (S.n > MAXN()) S.n = Math.max(1, MAXN());
const routeUrl = (k = S.route) => P('route-' + RT[k].slug + '.html');

/* ---------- toast ---------- */
const toast = (html, ms = 3200) => {
  let t = $('.k-toast');
  if (!t) { t = document.createElement('div'); t.className = 'k-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = html; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms);
};
const SOON = 'Not part of this concept yet. Try search, a route page or booking.';
const ONLY_LYNGEN = `Not designed in this concept. <a href="${P('search.html')}">See all routes</a>`;

/* ---------- page transitions: shared photos keep their place ---------- */
$$('[data-vt]').forEach((e) => { e.style.viewTransitionName = e.dataset.vt; });

/* ---------- generic clicks ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-go]');
  if (a) { e.preventDefault(); location.href = a.dataset.go; return; }
  const o = e.target.closest('[data-only]');
  if (o) { e.preventDefault(); toast(ONLY_LYNGEN, 4200); return; }
  const s = e.target.closest('[data-soon], a[href="#"]');
  if (s) { e.preventDefault(); toast(s.dataset.soon || SOON); }
});
$$('form').forEach((f) => f.addEventListener('submit', (e) => e.preventDefault()));

/* ---------- helpers for the drawn atoms ---------- */
const INK = '#14181A', SNOW = '#F3F5F4', ORANGE = '#F25C05';
const seatCells = (taken, mine, size) => {
  let h = '';
  for (let i = 0; i < 8; i++) {
    if (i < taken) h += `<span style="display:block;width:${size}px;height:${size}px;background:${INK}"></span>`;
    else if (i < taken + mine) h += `<span style="display:block;width:${size}px;height:${size}px;background:${ORANGE}"></span>`;
    else h += `<span style="display:block;width:${size}px;height:${size}px;box-sizing:border-box;border:2px solid ${8 - taken <= 2 ? ORANGE : INK}"></span>`;
  }
  return h;
};
const setSeats = (el, taken, mine, size) => { if (el) { el.innerHTML = seatCells(taken, mine, size); el.setAttribute('aria-label', `${taken} booked${mine ? ', ' + mine + ' yours' : ''}`); } };
const press = (btn, on, onStyle, offStyle) => { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); Object.assign(btn.style, on ? onStyle : offStyle); };
const CHIP_ON = { background: INK, color: SNOW, borderColor: INK };
const CHIP_OFF = { background: 'transparent', color: INK, borderColor: '#14181A40' };
const CARD_ON = { background: '#FFFFFF', border: `2px solid ${INK}` };
const CARD_OFF = { background: 'transparent', border: '1px solid #14181A40' };
const BOX_ON = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="${SNOW}" stroke-width="2"/></svg>`;
const setCheck = (label, on) => {
  const box = label.firstElementChild;
  box.setAttribute('style', on
    ? `width:18px;height:18px;flex:none;background:${INK};display:flex;align-items:center;justify-content:center`
    : `width:18px;height:18px;flex:none;box-sizing:border-box;border:1.5px solid ${INK}`);
  box.innerHTML = on ? BOX_ON : '';
  label.dataset.on = on ? '1' : '';
  label.setAttribute('aria-checked', on ? 'true' : 'false');
};
$$('label[data-check]').forEach((l) => {
  l.setAttribute('role', 'checkbox'); l.tabIndex = 0; l.style.cursor = 'pointer';
  l.addEventListener('click', (e) => { e.preventDefault(); setCheck(l, !l.dataset.on); l.dispatchEvent(new CustomEvent('k-change', { bubbles: true })); });
  l.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); l.click(); } });
});
const bind = (k, v) => $$(`[data-b="${k}"]`).forEach((e) => { e.innerHTML = v; });
const setLogo = (top) => { const L = (MOB ? window.KOTE_LOGOS_M : window.KOTE_LOGOS) || {}; if (L[top]) $$('[data-logo]').forEach((e) => { e.innerHTML = L[top]; }); };
const qs = new URLSearchParams(location.search);
const flash = sessionStorage.getItem('kote-toast'); if (flash) { sessionStorage.removeItem('kote-toast'); setTimeout(() => toast(flash), 400); }

/* ---------- mobile menu ---------- */
const menuBtn = $('[aria-label="Menu"]');
if (menuBtn) menuBtn.addEventListener('click', () => {
  let m = $('.k-menu');
  if (!m) {
    m = document.createElement('div'); m.className = 'k-menu';
    m.innerHTML = `<button type="button" class="k-menu-x" aria-label="Close menu">×</button>
      <a href="${P('index.html')}">Home</a><a href="${P('search.html')}">All routes</a><a href="${P('departures.html')}">Departures</a><a href="${P('grades.html')}">Grades</a><a href="${P('guides.html')}">Guides</a><a href="${P('safety.html')}">Safety</a><a href="${P('fitness.html')}">Fitness check</a>
      <a href="${P('my-trips.html')}">My trips</a><a href="agency.html">Agency view</a>
      <p>Kote is a concept by Iryna Chelombitko. Not a real company, nothing is charged.</p>`;
    root.appendChild(m);
    $('.k-menu-x', m).addEventListener('click', () => m.classList.remove('on'));
  }
  m.classList.add('on');
});
const go = (sel, url) => $$(sel).forEach((b) => { b.dataset.go = url; });
go('[aria-label="Search"]', P('search.html'));
go('[aria-label="My trips"]', P('my-trips.html'));

/* ---------- share / save ---------- */
$$('[data-act="share"], [aria-label="Share"]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast('Copy the address from the browser bar'); }
}));
const SAVEKEY = document.body.dataset.route || S.route;
const paintSave = () => $$('[data-act="save"], [aria-label="Save"]').forEach((b) => {
  const on = !!S.saved[SAVEKEY];
  if (b.textContent.trim()) { b.textContent = on ? 'Saved' : 'Save'; b.style.background = on ? INK : 'transparent'; b.style.color = on ? SNOW : INK; }
  else { b.style.background = 'transparent'; const p = $('path', b); if (p) p.setAttribute('fill', on ? INK : 'none'); }
});
$$('[data-act="save"], [aria-label="Save"]').forEach((b) => b.addEventListener('click', () => { S.saved[SAVEKEY] = !S.saved[SAVEKEY]; save(); paintSave(); toast(S.saved[SAVEKEY] ? 'Saved to My trips' : 'Removed from saved'); }));
paintSave();

/* ================================================================ HOME */
if (page === 'home') {
  if (window.kAt && !MOB) {
    const t0 = performance.now();
    const tick = (t) => { const ms = t - t0; window.kAt(ms); if (ms < 3600) requestAnimationFrame(tick); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) window.kAt(99999); else requestAnimationFrame(tick);
  }
  // region chips filter the departures table
  const chips = $$('[data-reg-chip]');
  const rows = $$('[data-row-reg]');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF));
    const r = c.dataset.regChip;
    let n = 0;
    rows.forEach((row) => { const on = r === 'All' || row.dataset.rowReg === r; row.style.display = on ? '' : 'none'; if (on) n++; });
    const empty = $('[data-reg-empty]');
    if (empty) empty.style.display = n ? 'none' : '';
  }));
  // grade picker: buttons are rebuilt from the on/off templates of the design
  const G = window.KOTE_GRADES || [];
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b || !G.length) return;
    const i = +b.dataset.g;
    $$('[data-g]').forEach((x) => {
      const j = +x.dataset.g, tmp = document.createElement('div');
      tmp.innerHTML = (j === i ? window.KOTE_G_ON : window.KOTE_G_OFF).replace(/__n__/g, G[j].n).replace(/__short__/g, G[j].short).replace(/__i__/g, j);
      x.replaceWith(tmp.firstElementChild);
    });
    Object.keys(G[i]).forEach((k) => bind('cur-' + k, G[i][k]));
  });
}

/* ================================================================ SEARCH */
if (page === 'search') {
  const arts = $$('[data-route]');
  const list = arts.length ? arts[0].parentElement : null;
  const F = { reg: new Set(['Norway', 'Sweden', 'Svalbard']), month: 'Jul', grades: new Set([4, 5]), sort: 'next' };
  const MONTHS = { Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September' };
  const LOGOS = window.KOTE_LOGOS || {};
  const apply = () => {
    let shown = [];
    arts.forEach((a) => {
      const d = a.dataset;
      const ok = F.reg.has(d.reg) && F.grades.has(+d.g) && d.months.split(',').includes(F.month);
      a.style.display = ok ? 'flex' : 'none';
      if (ok) shown.push(a);
    });
    const key = { next: (a) => +a.dataset.next, price: (a) => +a.dataset.price, ascent: (a) => -a.dataset.up, grade: (a) => -a.dataset.g }[F.sort];
    arts.slice().sort((x, y) => key(x) - key(y)).forEach((a) => list.insertBefore(a, $('[data-list-end]', list)));
    const n = shown.length;
    bind('count', `${n || 'No'} route${n === 1 ? '' : 's'} for ${MONTHS[F.month]}`);
    bind('count-foot', n ? `Showing all ${n}` : 'Nothing matches. Try another month or tick more regions.');
    bind('reg-val', F.reg.size ? [...F.reg].slice(0, 3).join(', ') + (F.reg.size > 3 ? ' +' + (F.reg.size - 3) : '') : 'Anywhere');
    bind('month-val', MONTHS[F.month] + ' 2027');
    const gs = [...F.grades].sort();
    bind('grade-val', gs.length === 5 || !gs.length ? 'Any' : gs.length === 1 ? String(gs[0]) : gs.slice(0, -1).join(', ') + ' and ' + gs[gs.length - 1]);
    const top = shown.reduce((m, a) => (+a.dataset.top > (m ? +m.dataset.top : -1) ? a : m), null);
    if (top) {
      bind('top-note', `The logo shows the highest point among these routes: ${top.dataset.peak}, ${top.dataset.top} m.`);
      const L = LOGOS[top.dataset.top]; if (L) $$('[data-logo]').forEach((e) => { e.innerHTML = L; });
    } else bind('top-note', 'No routes, so the logo has nothing to measure.');
  };
  $$('label[data-f-reg]').forEach((l) => l.addEventListener('k-change', () => { l.dataset.on ? F.reg.add(l.dataset.fReg) : F.reg.delete(l.dataset.fReg); apply(); }));
  $$('[data-f-month]').forEach((b) => b.addEventListener('click', () => { F.month = b.dataset.fMonth; $$('[data-f-month]').forEach((x) => press(x, x === b, CHIP_ON, CHIP_OFF)); apply(); }));
  $$('[data-f-grade]').forEach((b) => b.addEventListener('click', () => {
    const g = +b.dataset.fGrade; F.grades.has(g) ? F.grades.delete(g) : F.grades.add(g);
    press(b, F.grades.has(g), CHIP_ON, CHIP_OFF); apply();
  }));
  $$('[data-f-sort]').forEach((b) => b.addEventListener('click', () => { F.sort = b.dataset.fSort; $$('[data-f-sort]').forEach((x) => press(x, x === b, CHIP_ON, CHIP_OFF)); apply(); }));
  $$('[data-f-clear]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    F.reg = new Set(['Norway', 'Sweden', 'Iceland', 'Faroe Islands', 'Svalbard']); F.grades = new Set([1, 2, 3, 4, 5]);
    $$('label[data-f-reg]').forEach((l) => setCheck(l, true));
    $$('[data-f-grade]').forEach((x) => press(x, true, CHIP_ON, CHIP_OFF)); apply();
  }));
  $$('[data-f-update]').forEach((b) => b.addEventListener('click', () => { apply(); toast('Filters applied'); }));
  apply();
}

/* ================================================================ ROUTE */
if (page === 'route') {
  const PK = document.body.dataset.route || 'hero';
  const PR = RT[PK];
  // day picker: profile and rows
  const pick = (i) => {
    $$('[data-prof]').forEach((p) => { p.style.display = +p.dataset.prof === i ? '' : 'none'; });
    $$('[data-day]').forEach((r) => { const on = +r.dataset.day === i; r.classList.toggle('k-day-on', on); const x = $('[data-day-more]', r); if (x) x.style.display = on ? '' : 'none'; });
  };
  $$('[data-day]').forEach((r) => r.addEventListener('click', () => pick(+r.dataset.day)));
  $$('[data-prof-hit]').forEach((h) => h.addEventListener('click', () => pick(+h.dataset.profHit)));
  const first = $('.k-day-on'); pick(first ? +first.dataset.day : 2);
  // booking panel: shows this route; the booking in progress switches to it on the first touch
  const mine = S.route === PK;
  const L = { dep: mine ? S.dep : PR.defdep, n: S.n };
  const qd = +qs.get('dep'); if (qs.has('dep') && PR.deps[qd] && 8 - PR.deps[qd].taken > 0) L.dep = qd;
  const lfree = (i = L.dep) => 8 - PR.deps[i].taken;
  if (lfree() < 1) L.dep = PR.defdep;
  if (L.n > Math.min(4, lfree())) L.n = Math.max(1, Math.min(4, lfree()));
  const commit = () => { useRoute(PK); S.dep = L.dep; S.n = L.n; save(); };
  const paintPanel = () => {
    $$('[data-dep]').forEach((b) => press(b, +b.dataset.dep === L.dep, CARD_ON, { background: 'transparent', border: '1px solid #14181A26' }));
    bind('n', L.n);
    bind('total', eur(PR.price * L.n));
    bind('total-label', `Total for ${L.n}`);
    $$('[data-book]').forEach((b) => { b.textContent = `Book ${L.n} place${L.n > 1 ? 's' : ''}`; });
  };
  $$('[data-dep]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.dep;
    if (lfree(i) < 1) { window.koteWaitlist(PR.deps[i].d, PR.name); return; }
    L.dep = i; if (L.n > Math.min(4, lfree())) L.n = Math.min(4, lfree()); commit(); paintPanel();
  }));
  $$('[data-n]').forEach((b) => b.addEventListener('click', () => {
    const v = L.n + +b.dataset.n, mx = Math.min(4, lfree());
    if (v < 1) return;
    if (v > mx) { toast(lfree() <= 4 ? `Only ${lfree()} place${lfree() > 1 ? 's' : ''} left on ${PR.deps[L.dep].d}` : 'One booking holds up to 4 people'); return; }
    L.n = v; commit(); paintPanel();
  }));
  $$('[data-book]').forEach((b) => b.addEventListener('click', () => { commit(); location.href = P('book-1.html'); }));
  paintPanel();
  // photos
  $$('[data-photos]').forEach((b) => b.addEventListener('click', () => {
    let lb = $('.k-lb');
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'k-lb';
      lb.innerHTML = '<button type="button" class="k-lb-x" aria-label="Close photos">×</button><div class="k-lb-s">' +
        (window.KOTE_PHOTOS || []).map((p) => `<figure><img src="${p[0]}" alt="${p[1]}" loading="lazy"><figcaption>${p[1]}</figcaption></figure>`).join('') + '</div>';
      document.body.appendChild(lb);
      $('.k-lb-x', lb).addEventListener('click', () => lb.classList.remove('on'));
      lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('on'); });
    }
    lb.classList.add('on');
  }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { const lb = $('.k-lb'); if (lb) lb.classList.remove('on'); } });
}

/* ---------- route details shared by booking, booked and my trips ---------- */
const paintRoute = (RR = R) => {
  bind('r-name', RR.name);
  bind('r-sub', RR.glabel);
  $$('[data-r-photo]').forEach((im) => { im.src = RR.photo; im.style.objectPosition = RR.pos; im.alt = RR.name; });
  $$('[data-r-vt]').forEach((e) => { e.style.viewTransitionName = 'k-ph-' + RR.key; });
  $$('[data-r-link]').forEach((a) => { const u = P('route-' + RR.slug + '.html'); if (a.tagName === 'A') a.href = u; else a.dataset.go = u; });
};

/* ================================================================ BOOKING */
if (page && page.startsWith('book')) {
  const step = +page.slice(4);
  paintRoute();
  bind('ex-where', R.exwhere);
  const paintSummary = () => {
    bind('dates', dep().full);
    $$('[data-mine-seats]').forEach((e) => setSeats(e, dep().taken, S.n, +e.dataset.mineSeats));
    let lines = `<div class="k-line"><span>${S.n} × ${R.name}</span><span>${eur(PRICE() * S.n)}</span></div>`;
    if (step >= 3) allowed().forEach((x) => { const q = S.ex[x.k] || 0; if (q) lines += `<div class="k-line"><span>${q} × ${x.name}</span><span>${eur(q * x.price)}</span></div>`; });
    bind('lines', lines);
    const t = step >= 3 ? total() : PRICE() * S.n;
    bind('sum-total', eur(t));
    bind('sum-deposit', eur(DEPOSIT * S.n));
    bind('sum-balance', eur(t - DEPOSIT * S.n));
    bind('sum-due', `Balance by ${balanceDate()}`);
    bind('n-travellers', `${S.n} traveller${S.n > 1 ? 's' : ''}`);
    bind('n', S.n);
    bind('m-total', eur(t));
  };
  // step 1: departure cards are drawn from the route data
  const box = $('[data-dep-cards]');
  if (box) {
    const tpl = box.dataset.tpl ? JSON.parse(box.dataset.tpl) : null;
    box.innerHTML = R.deps.map((d, i) => `<button type="button" data-dep-card="${i}" aria-pressed="false" style="${tpl.btn}">
<span style="display:flex;justify-content:space-between;align-items:baseline"><span style="${tpl.date}">${d.d}</span><span style="font-size:13px;color:#4A5458">Guide: ${d.guide}</span></span>
<span role="img" data-seats="14" style="display:flex;gap:3px"></span><span data-left style="font-size:14px"></span></button>`).join('');
  }
  const paint1 = () => {
    $$('[data-dep-card]').forEach((c) => {
      const i = +c.dataset.depCard, on = i === S.dep, d = R.deps[i];
      press(c, on, CARD_ON, CARD_OFF);
      setSeats($('[data-seats]', c), d.taken, on ? S.n : 0, +$('[data-seats]', c).dataset.seats);
      const f = 8 - d.taken;
      $('[data-left]', c).textContent = f < 1 ? 'Full, waitlist' : on ? (S.n === f ? `The last ${f === 1 ? 'place' : f + ' places'}, yours` : `${S.n} yours, ${f - S.n} still free`) : `${f} place${f > 1 ? 's' : ''} left`;
      $('[data-left]', c).style.fontWeight = on ? '700' : '400';
      c.style.opacity = f < 1 ? '0.55' : '';
    });
    paintSummary();
  };
  $$('[data-dep-card]').forEach((c) => c.addEventListener('click', () => {
    const i = +c.dataset.depCard;
    if (8 - R.deps[i].taken < 1) { window.koteWaitlist(R.deps[i].d, R.name); return; }
    S.dep = i; if (S.n > MAXN()) S.n = MAXN(); save(); paint1();
  }));
  $$('[data-n]').forEach((b) => b.addEventListener('click', () => {
    const v = S.n + +b.dataset.n;
    if (v < 1) return;
    if (v > MAXN()) { toast(free() < 4 ? `Only ${free()} place${free() > 1 ? 's' : ''} left on ${dep().d}. Pick another date for more.` : 'One booking holds up to 4 people'); return; }
    S.n = v;
    allowed().forEach((x) => { if (x.per && S.ex[x.k] > S.n) S.ex[x.k] = S.n; });
    save(); paint1(); paintT2();
  }));
  // step 2: second traveller block follows the count
  const paintT2 = () => { $$('[data-t2]').forEach((e) => { e.style.display = S.n > 1 ? '' : 'none'; }); bind('t2-label', S.n > 2 ? `Traveller 2 <span style="font-weight:400;font-size:15px;color:#4A5458">(and ${S.n - 2} more, we email them the same form)</span>` : 'Traveller 2'); };
  // step 3 extras: only what this route needs
  $$('[data-ex]').forEach((row) => {
    const note = R.extras ? R.extras[row.dataset.ex] : undefined;
    if (note === undefined) row.style.display = 'none';
    else { const n = $('[data-ex-note]', row); if (n) n.textContent = note; }
  });
  const paint3 = () => {
    $$('[data-ex]').forEach((row) => {
      const k = row.dataset.ex, q = S.ex[k] || 0;
      $('[data-q]', row).textContent = q;
      const minus = $('[data-ex-d="-1"]', row), plus = $('[data-ex-d="1"]', row);
      minus.style.borderColor = q ? INK : '#14181A40';
      plus.style.background = q ? INK : 'transparent'; plus.style.color = q ? SNOW : INK;
    });
    paintSummary();
  };
  $$('[data-ex-d]').forEach((b) => b.addEventListener('click', () => {
    const row = b.closest('[data-ex]'), k = row.dataset.ex, x = EXTRAS.find((e) => e.k === k);
    const max = x.per ? S.n : 1;
    const v = (S.ex[k] || 0) + +b.dataset.exD;
    if (v < 0) return;
    if (v > max) { toast(x.per ? `One per traveller, you are ${S.n}` : 'One is enough'); return; }
    S.ex[k] = v; save(); paint3();
  }));
  // step 4
  const paint4 = () => {
    $$('[data-pay]').forEach((b) => press(b, b.dataset.pay === S.pay, CARD_ON, CARD_OFF));
    bind('pay-dep-sub', `${eur(DEPOSIT * S.n)} today, ${eur(total() - DEPOSIT * S.n)} by ${balanceDate()}`);
    bind('pay-full-sub', `${eur(total())} today`);
    $$('[data-pay-go]').forEach((b) => { b.textContent = `Pay ${eur(depositDue())} and book`; });
    bind('change-until', `You can still change the date for free until ${balanceDate()}.`);
  };
  $$('[data-pay]').forEach((b) => b.addEventListener('click', () => { S.pay = b.dataset.pay; save(); paint4(); }));
  $$('label[data-terms]').forEach((l) => l.addEventListener('k-change', () => { S.terms = !!l.dataset.on; save(); }));
  $$('[data-pay-go]').forEach((b) => b.addEventListener('click', () => {
    if (!S.terms) { toast('Tick the cancellation terms first'); return; }
    b.textContent = 'Booking…';
    S.trip = { route: S.route, dep: S.dep, n: S.n, pay: S.pay, ex: Object.assign({}, S.ex) }; save();
    sessionStorage.setItem('kote-toast', 'Booked in the prototype. Design concept: no payment was taken.');
    setTimeout(() => { location.href = P('booked.html'); }, 700);
  }));
  $$('label[data-share]').forEach((l) => { setCheck(l, S.share); l.addEventListener('k-change', () => { S.share = !!l.dataset.on; save(); }); });
  $$('label[data-terms]').forEach((l) => setCheck(l, S.terms));
  if (step === 1) paint1();
  if (step === 2) { paintT2(); paintSummary(); }
  if (step === 3) paint3();
  if (step === 4) { paint4(); paintSummary(); }
}

/* the trip shown on Booked and My trips: the last booking made, Lyngen by default */
const TRIP = (() => {
  const t = S.trip && RT[S.trip.route] ? S.trip : { route: 'hero', dep: 1, n: 2, pay: 'deposit', ex: exDefault('hero') };
  const TR = RT[t.route], d = TR.deps[t.dep] || TR.deps[TR.defdep];
  const ext = EXTRAS.filter((x) => TR.extras && TR.extras[x.k] !== undefined).reduce((a, x) => a + x.price * ((t.ex || {})[x.k] || 0), 0);
  const tot = TR.price * t.n + ext;
  return { t, R: TR, d, total: tot, balance: tot - DEPOSIT * t.n, due: balanceDate(d) };
})();

/* ================================================================ BOOKED */
if (page === 'booked') {
  const { t, R: TR, d } = TRIP;
  const n = t.n;
  paintRoute(TR);
  const code = 'KT-27-' + String(d.start[1] + 1).padStart(2, '0') + String(d.start[2]).padStart(2, '0') + '-14';
  bind('code', 'Booking ' + code);
  bind('headline', `You are in.<br>${words[n]} place${n > 1 ? 's' : ''} ${TR.on[0]}<br>${TR.on[1]}.`);
  $$('[data-big-seats]').forEach((e) => { let h = ''; for (let i = 0; i < 8; i++) h += `<span style="display:block;width:${e.dataset.bigSeats}px;height:${e.dataset.bigSeats}px;box-sizing:border-box;${i < d.taken ? 'background:' + INK : i < d.taken + n ? 'background:' + ORANGE : 'border:2px solid ' + INK}"></span>`; e.innerHTML = h; });
  const left = 8 - d.taken - n;
  bind('seat-note', `The orange square${n > 1 ? 's are' : ' is'} you. ${left ? left + ' place' + (left > 1 ? 's' : '') + ' still open.' : 'The group is full.'}`);
  $$('[data-r-night]').forEach((im) => { im.src = TR.night[0]; im.style.objectPosition = TR.night[2]; im.alt = TR.night[1]; });
  bind('night-cap', TR.night[1]);
  const st = dateOf(d.start), call = new Date(st); call.setDate(call.getDate() - 59); const meet = new Date(st); meet.setDate(meet.getDate() - 1);
  bind('next-call-date', 'Week of ' + fmtDay(call));
  bind('next-call', `${d.guide.split(' ')[0]}, your guide, calls ${n === 2 ? 'you both' : n > 2 ? 'you all' : 'you'}. 20 minutes.`);
  bind('next-bal-date', TRIP.due);
  bind('next-bal', t.pay === 'full' ? 'Nothing left to pay. Paid in full today.' : `Balance ${eur(TRIP.balance)} due. We remind you a week before.`);
  bind('next-meet-date', fmtDay(meet) + ', 18:00');
  bind('next-meet', `Meet in ${TR.meet}. Kit check and dinner.`);
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => {
    const p = (x) => String(x).padStart(2, '0');
    const s = dateOf(d.start), e = new Date(s); e.setDate(e.getDate() + TR.days);
    const f = (x) => x.getFullYear() + p(x.getMonth() + 1) + p(x.getDate());
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kote concept//EN', 'BEGIN:VEVENT', 'UID:' + code + '@kote.concept', 'DTSTART;VALUE=DATE:' + f(s), 'DTEND;VALUE=DATE:' + f(e),
      'SUMMARY:' + TR.name + ' (Kote concept)', 'LOCATION:' + TR.meet + ', ' + TR.country, 'DESCRIPTION:Concept prototype by Iryna Chelombitko. Not a real trip.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'kote-' + TR.slug + '.ics'; a.click();
  }));
}

/* ================================================================ MY TRIPS */
if (page === 'trips') {
  const { t, R: TR, d } = TRIP;
  paintRoute(TR);
  const days = Math.max(0, Math.ceil((dateOf(d.start) - new Date()) / 86400000));
  bind('days', days);
  bind('trip-line', `${d.full}, guide ${d.guide}`);
  bind('trip-n', `Next trip, ${t.n} traveller${t.n > 1 ? 's' : ''}`);
  bind('bal-due', t.pay === 'full' ? 'Paid in full' : `Due ${TRIP.due}`);
  bind('bal-title', t.pay === 'full' ? 'Balance' : `Balance ${eur(TRIP.balance)}`);
  bind('dep-title', `${t.pay === 'full' ? 'Paid in full' : 'Deposit'} ${eur(t.pay === 'full' ? TRIP.total : DEPOSIT * t.n)}`);
  bind('bal-btn', t.pay === 'full' ? 'Paid in full' : 'Pay balance');
  bind('travel-a', TR.travel[0]);
  bind('travel-b', TR.travel[1]);
  const kitN = ((S.kit || {})[t.route] || []).length, kitT = TR.kitn || 31;
  bind('kit-sub', `${kitN} of ${kitT} items ticked`);
  bind('kit-count', `${kitN} of ${kitT}`);
  $$('[data-kitbar]').forEach((e) => { let h = ''; for (let i = 0; i < kitT; i++) h += `<span style="flex:1;height:8px;background:${i < kitN ? INK : '#14181A26'}"></span>`; e.innerHTML = h; });
  const tick = (key) => { const el = $(`[data-b="${key}"]`); const row = el && el.closest('div[style*="grid"], [data-go]'); if (!row) return;
    const box = row.querySelector('span'); if (box) { box.style.cssText = 'width:20px;height:20px;background:#14181A;display:flex;align-items:center;justify-content:center;flex:none'; box.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="#F3F5F4" stroke-width="2"/></svg>'; }
    const a = row.querySelector('a'); if (a) a.textContent = 'View'; };
  if (t.pay === 'full') { tick($('[data-b="bal-title"]') ? 'bal-title' : 'bal-due'); bind('bal-due', 'Nothing left to pay'); }
  if (kitN >= kitT) tick('kit-sub');
  bind('ready-n', `${2 + (kitN >= kitT ? 1 : 0) + (t.pay === 'full' ? 1 : 0)} of 5 done`);
}

/* ================================================================ DEPARTURES */
if (page === 'departures') {
  const chips = $$('[data-m-chip]');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF));
    const m = c.dataset.mChip; let n = 0;
    $$('[data-m]').forEach((e) => {
      const on = m === 'all' || e.dataset.m === m;
      if (e.style.position === 'absolute') e.style.opacity = on ? '' : '0.18';
      else { e.style.display = on ? '' : 'none'; if (on) n++; }
    });
    $$('[data-m-group]').forEach((g) => { g.style.display = m === 'all' || g.dataset.mGroup === m ? '' : 'none'; });
    bind('dep-count', `${n} departure${n === 1 ? '' : 's'}`);
  }));
}

/* ================================================================ FITNESS CHECK */
if (page === 'fitness') {
  const Q = window.KOTE_QUIZ || { G: [], routes: {} };
  const N = 5;
  const A = (S.fit && Array.isArray(S.fit.a)) ? S.fit.a.slice(0, N) : [];
  const paint = () => {
    $$('[data-q]').forEach((b) => press(b, A[+b.dataset.q] === +b.dataset.a, CARD_ON, CARD_OFF));
    const done = A.filter((v) => v !== undefined && v !== null).length;
    if (done < N) {
      bind('fit-label', done ? `${N - done} question${N - done > 1 ? 's' : ''} to go` : 'Answer all five to see your grade');
      bind('fit-grade', '?'); bind('fit-name', ''); bind('fit-text', ''); bind('fit-routes', '');
      $$('[data-fit-reset]').forEach((b) => { b.style.display = done ? '' : 'none'; });
      return;
    }
    $$('[data-fit-reset]').forEach((b) => { b.style.display = ''; });
    const sc = A.reduce((a, v) => a + v, 0);
    let g = sc <= 2 ? 1 : sc <= 4 ? 2 : sc <= 6 ? 3 : sc <= 9 ? 4 : 5;
    if (A[4] === 0) g = Math.min(g, 4);
    if (A[3] === 0) g = Math.min(g, 3);
    if (A[2] === 0) g = Math.min(g, 2);
    const G = Q.G[g - 1];
    bind('fit-label', 'Your grade, before the call');
    bind('fit-grade', g); bind('fit-name', G.short);
    bind('fit-text', `Days ${G.a}, ${G.h}. Pack ${G.p}. ${G.t}.`);
    let rs = (Q.routes[g] || []).concat(g >= 4 ? (Q.routes[g - 1] || []) : []);
    let note = '';
    if (!rs.length) { rs = Q.routes[3] || []; note = `<div style="font-size:14px;line-height:1.45;color:#D3D9DA">Kote runs grades 3 to 5 only. These two are the gentlest; mention it on the call.</div>`; }
    bind('fit-routes', note + rs.map((r) => `<a href="${P('route-' + r.slug + '.html')}" style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-top:1px solid #F3F5F433;text-decoration:none;color:#F3F5F4"><span style="font-size:20px;font-weight:800;font-stretch:62%">${r.name}</span><span style="font-size:13px;color:#B9C1C3">grade ${r.g}, ▲${r.top}</span></a>`).join(''));
    const top = rs.reduce((m, r) => Math.max(m, r.top), 0); if (top) setLogo(String(top));
    S.fit = { a: A.slice(), g }; save();
  };
  $$('[data-q]').forEach((b) => b.addEventListener('click', () => {
    A[+b.dataset.q] = +b.dataset.a; paint();
    const done = A.filter((v) => v !== undefined && v !== null).length;
    if (done === N && MOB) { const r = $('[data-fit-result]'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }));
  $$('[data-fit-reset]').forEach((b) => b.addEventListener('click', () => { A.length = 0; delete S.fit; save(); setLogo('1520'); paint(); }));
  paint();
}

/* ================================================================ KIT LIST */
if (page === 'kit') {
  const K = window.KOTE_KIT || { items: {}, cats: [] };
  const rk = RT[qs.get('r')] ? qs.get('r') : TRIP.t.route;
  const KR = RT[rk];
  const items = K.items[rk] || [];
  const rented = rk === TRIP.t.route ? (TRIP.t.ex || {}) : {};
  S.kit = S.kit || {};
  const have = new Set(S.kit[rk] || []);
  items.forEach((it) => { if (it.ex && rented[it.ex]) have.add(it.id); });
  setLogo(String(KR.top));
  bind('kit-sub', `For the ${KR.name}. Pack this, then open the bag at the briefing in ${KR.meet} the evening before day 1.`);
  const list = $('[data-kit-list]');
  const row = (it) => {
    const on = have.has(it.id), r = it.ex && rented[it.ex];
    const note = r ? `Rented, waits in ${KR.meet}` : it.note;
    return `<label data-kit="${it.id}" role="checkbox" tabindex="0" aria-checked="${on}" style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid #14181A26;cursor:pointer;font-size:${MOB ? 15 : 16}px${MOB ? ';padding-left:20px;padding-right:20px' : ''}">
<span style="width:18px;height:18px;flex:none;margin-top:1px;box-sizing:border-box;${on ? 'background:' + INK + ';display:flex;align-items:center;justify-content:center' : 'border:1.5px solid ' + INK}">${on ? BOX_ON : ''}</span>
<span style="flex:1"><span style="${on ? 'color:#4A5458;text-decoration:line-through' : ''}">${it.name}</span>${note ? `<span style="display:block;font-size:13px;color:${r ? INK : '#4A5458'};margin-top:2px;${r ? 'font-weight:700' : ''}">${note}</span>` : ''}</span></label>`;
  };
  const render = () => {
    list.innerHTML = K.cats.map(([c, title]) => {
      const its = items.filter((i) => i.cat === c); if (!its.length) return '';
      return `<div style="display:flex;flex-direction:column;${MOB ? 'padding-top:14px' : 'padding-bottom:22px'}"><div style="font-size:${MOB ? 26 : 30}px;font-weight:800;font-stretch:62%;padding:0 ${MOB ? '20px' : '0'} 8px">${title}</div>${its.map(row).join('')}</div>`;
    }).join('');
    const n = items.filter((i) => have.has(i.id)).length;
    bind('kit-count', `${n} of ${items.length}`);
    $$('[data-kitbar]').forEach((e) => { let h = ''; for (let i = 0; i < items.length; i++) h += `<span style="flex:1;height:8px;background:${i < n ? INK : '#14181A26'}"></span>`; e.innerHTML = h; });
    $$('[data-kit]', list).forEach((l) => {
      const flip = () => { const id = l.dataset.kit; have.has(id) ? have.delete(id) : have.add(id); S.kit[rk] = [...have]; save(); render(); if ([...have].length === items.length) toast('Everything packed. See you at the briefing.'); };
      l.addEventListener('click', (e) => { e.preventDefault(); flip(); });
      l.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    });
  };
  S.kit[rk] = [...have]; save();
  render();
}

/* ================================================================ PAY BALANCE */
if (page === 'pay') {
  const { t, R: TR, d } = TRIP;
  paintRoute(TR);
  setLogo(String(TR.top));
  bind('pay-dates', d.full);
  let lines = `<div class="k-line"><span>${t.n} × ${TR.name}</span><span>${eur(TR.price * t.n)}</span></div>`;
  EXTRAS.forEach((x) => { const q = (t.ex || {})[x.k] || 0; if (q && TR.extras && TR.extras[x.k] !== undefined) lines += `<div class="k-line"><span>${q} × ${x.name}</span><span>${eur(q * x.price)}</span></div>`; });
  lines += `<div class="k-line" style="color:#4A5458"><span>Deposit paid</span><span>−${eur(DEPOSIT * t.n)}</span></div>`;
  bind('pay-lines', lines);
  const paid = t.pay === 'full';
  bind('pay-now', paid ? '€0' : eur(TRIP.balance));
  bind('pay-sub', paid ? `Your ${TR.name} trip is paid in full. Nothing left to do here.` : `Balance for your ${TR.name} trip, due ${TRIP.due}. Pay it now and you are done.`);
  $$('[data-balance-go]').forEach((b) => {
    b.textContent = paid ? 'Paid in full' : `Pay ${eur(TRIP.balance)}`;
    if (paid) { b.style.background = '#14181A26'; b.style.cursor = 'default'; }
    b.addEventListener('click', () => {
      if (paid) return;
      b.textContent = 'Paying…';
      S.trip = Object.assign({}, t, { pay: 'full' }); save();
      sessionStorage.setItem('kote-toast', 'Balance marked as paid. Design concept: no money was taken.');
      setTimeout(() => { location.href = P('my-trips.html'); }, 700);
    });
  });
}

/* ================================================================ AGENCY */
if (page === 'agency-bookings') {
  const rows = $$('[data-bk]');
  const drawer = $('[data-drawer]');
  const open = (r) => {
    rows.forEach((x) => { x.style.background = x === r ? '#FFFFFF' : ''; x.style.boxShadow = x === r ? `inset 3px 0 0 ${ORANGE}` : ''; });
    const c = r.children;
    bind('dr-id', c[0].textContent); bind('dr-name', c[1].textContent);
    bind('dr-sub', +c[3].textContent > 1 ? `+${+c[3].textContent - 1} traveller${+c[3].textContent > 2 ? 's' : ''}` : 'Travels alone');
    bind('dr-dep', c[2].textContent);
    bind('dr-status', c[4].textContent.trim());
    bind('dr-next', c[5].textContent.trim() || 'Nothing due');
    drawer.style.display = '';
  };
  rows.forEach((r) => { r.style.cursor = 'pointer'; r.addEventListener('click', () => open(r)); });
  $$('[data-drawer-x]').forEach((b) => b.addEventListener('click', () => { drawer.style.display = 'none'; rows.forEach((x) => { x.style.background = ''; x.style.boxShadow = ''; }); }));
  $$('[data-st]').forEach((c) => c.addEventListener('click', () => {
    $$('[data-st]').forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF));
    const s = c.dataset.st;
    rows.forEach((r) => { const t = r.children[4].textContent.trim(), dp = r.children[2].textContent; r.style.display = s === 'all' || (s === 'July' ? / Jul/.test(dp) : t === s) ? '' : 'none'; });
  }));
}
if (page === 'agency') {
  $$('[data-range]').forEach((c) => c.addEventListener('click', () => { $$('[data-range]').forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF)); toast('Only the month view has data in this concept'); }));
}
$$('[data-say]').forEach((b) => b.addEventListener('click', () => toast(b.dataset.say)));
const chipset = (attr, fn) => { const cs = $$(`[${attr}]`); cs.forEach((c) => c.addEventListener('click', () => { cs.forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF)); fn(c.getAttribute(attr)); })); };
if (page === 'agency-departures') {
  const DD = window.KOTE_AG_DEPS, rows = $$('[data-dep]');
  const dot = (c) => `<span style="width:8px;height:8px;background:${c};flex:none"></span>`;
  const open = (r) => {
    rows.forEach((x) => x.setAttribute('aria-selected', x === r ? 'true' : 'false'));
    const d = DD[r.dataset.dep], g = d.group, sum = (f) => g.filter(f).reduce((a, x) => a + x.p, 0);
    bind('ro-name', d.name); bind('ro-dates', d.d + ' 2027'); bind('ro-guide', 'Guide ' + d.guide);
    $('[data-b="ro-seats"]').innerHTML = r.children[2].innerHTML;
    bind('ro-paid', `${sum((x) => x.pay === 'Paid')}/${d.taken}`); bind('ro-fit', `${sum((x) => x.fit === 'Done')}/${d.taken}`); bind('ro-kit', `${sum((x) => x.kit === 20)}/${d.taken}`);
    $('[data-b="ro-list"]').innerHTML = g.length ? g.map((x) => `<div style="display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:10px 0;border-top:1px solid #14181A1F;font-size:14px">
<span style="font-weight:700">${x.n}${x.p > 1 ? ` <span style="font-weight:400;color:#4A5458">+${x.p - 1}</span>` : ''}</span><span style="display:flex;align-items:center;gap:7px;justify-content:flex-end">${dot(x.pay === 'Overdue' ? ORANGE : x.pay === 'Paid' ? INK : '#8B9497')}${x.pay}</span>
<span style="font-size:13px;color:#4A5458">Fitness: ${x.fit}</span><span style="font-size:13px;color:${x.fit === 'No slot' ? ORANGE : '#4A5458'};text-align:right">Kit ${x.kit} of 20</span></div>`).join('') : '<div style="padding:10px 0;font-size:14px;color:#4A5458">Nobody has booked yet.</div>';
  };
  rows.forEach((r) => { r.addEventListener('click', () => open(r)); r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(r); } }); });
  chipset('data-dm', (m) => rows.forEach((r) => { r.style.display = m === 'all' || r.dataset.m === m ? '' : 'none'; }));
  const want = new URLSearchParams(location.search).get('d');
  const first = rows.find((r) => r.dataset.dep === want) || rows.find((r) => r.dataset.dep === 'hero-1') || rows[0];
  open(first); if (want) first.scrollIntoView({ block: 'center' });
}
if (page === 'agency-guides') chipset('data-gl', (l) => $$('[data-guide]').forEach((g) => { g.style.display = l === 'all' || g.dataset.load === l ? 'grid' : 'none'; }));
if (page === 'agency-rentals') {
  chipset('data-dp', (d) => $$('[data-depot]').forEach((r) => { r.style.display = d === 'all' || r.dataset.depot === d ? '' : 'none'; }));
  $$('[data-packed]').forEach((b) => b.addEventListener('click', () => {
    const on = b.textContent !== 'Packed'; b.textContent = on ? 'Packed' : 'Mark packed';
    Object.assign(b.style, on ? { background: INK, color: SNOW } : { background: 'transparent', color: INK });
    b.closest('[data-pack]').style.opacity = on ? '.55' : '1';
    bind('pack-n', `${$$('[data-packed]').filter((x) => x.textContent === 'Packed').length} of 4 packed`);
  }));
}
if (page === 'agency-payouts') {
  const eur = (n) => '€' + n.toLocaleString('en-US');
  chipset('data-pf', (f) => $$('[data-po]').forEach((r) => { r.style.display = f === 'all' || r.dataset.po === f ? '' : 'none'; }));
  $$('[data-approve]').forEach((b) => b.addEventListener('click', () => {
    const r = b.closest('tr'), a = +b.dataset.approve, due = $('[data-b="k-due"]'), paid = $('[data-b="k-paid"]');
    due.dataset.v = +due.dataset.v - a; paid.dataset.v = +paid.dataset.v + a; due.textContent = eur(+due.dataset.v); paid.textContent = eur(+paid.dataset.v);
    r.dataset.po = 'Paid'; const st = r.querySelector('[data-po-st]'); st.children[0].style.background = INK; st.children[1].textContent = 'Paid';
    b.remove(); const left = $$('[data-approve]').length;
    bind('k-due-s', left ? `${left} payout${left > 1 ? 's' : ''} wait for you` : 'Nothing waits for you'); bind('k-paid-s', `${$$('[data-po="Paid"]').length} payouts`);
    toast(`${eur(a)} sent to ${r.children[0].textContent}`);
  }));
}
/* ================================================================ FINISHING: dialogs, waitlist, contact, map view, phone filters */
const ask = (title, text, fields, ok, done) => {
  const m = document.createElement('div'); m.className = 'k-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<form><h3>${title}</h3>${text ? `<div style="font-size:15px;line-height:1.45">${text}</div>` : ''}${fields.map((f) => `<label>${f.l}${f.opts ? `<select name="${f.n}">${f.opts.map((o) => `<option>${o}</option>`).join('')}</select>` : f.area ? `<textarea name="${f.n}" rows="4" required></textarea>` : `<input name="${f.n}" type="${f.t || 'text'}" required autocomplete="off" placeholder="${f.p || ''}">`}</label>`).join('')}
<small>Design concept: nothing is sent or stored.</small><div class="k-row"><button type="button" data-x>Cancel</button><button type="submit">${ok}</button></div></form>`;
  const close = () => m.remove();
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-x]')) close(); });
  m.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  m.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); close(); done(v); });
  document.body.appendChild(m); const f = m.querySelector('input,select,textarea'); if (f) f.focus();
};
window.koteWaitlist = (d, name) => ask('Join the waitlist', `${d} on ${name} is full. Leave an email and you get the place if someone drops out.`, [{ l: 'Email', n: 'e', t: 'email', p: 'you@example.com' }], 'Join', () => toast(`You are on the waitlist for ${d}. Concept: no email is sent.`, 4200));
$$('[data-msg-guide]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); ask('Message the guide', 'Your guide reads messages in the evening when there is signal.', [{ l: 'Message', n: 'm', area: 1 }], 'Send', () => toast('Message written. Concept: it is not sent to anyone.', 4200)); }));
$$('[data-new-dep]').forEach((b) => b.addEventListener('click', () => ask('New departure', '', [{ l: 'Route', n: 'r', opts: Object.values(RT || {}).map((r) => r.name).filter(Boolean).length ? Object.values(RT).map((r) => r.name) : ['Lyngen Alps traverse', 'Sarek, no trail', 'Kebnekaise north ridge'] }, { l: 'First day', n: 'd', t: 'date' }, { l: 'Lead guide', n: 'g', opts: ['Ingrid H.', 'Mats E.', 'Siri L.', 'Jonas B.', 'Kaja R.', 'Ásta G.', 'Rói J.', 'Anna K.', 'Erik S.'] }], 'Save draft', (v) => toast(`Draft saved: ${v.r}, guide ${v.g}. Concept: it is not stored.`, 4200))));
$$('[data-contact]').forEach((f) => f.addEventListener('submit', (e) => {
  e.preventDefault(); e.stopImmediatePropagation(); const d = $('[data-contact-done]', f), n = f.elements.n.value.trim().split(' ')[0];
  d.hidden = false; d.innerHTML = `<b>Thanks, ${n.replace(/[<>&]/g, '')}.</b> In the real product a guide would answer within two working days. This is a design concept, so the message was not sent.`; f.reset();
}));
if (page === 'search' && window.KOTE_MAPS) {
  const mb = $('[data-f-map]'), lb = $('[data-f-list]');
  const view = (map) => {
    press(mb, map, CHIP_ON, CHIP_OFF); press(lb, !map, CHIP_ON, CHIP_OFF);
    $$('article[data-route]').forEach((a) => {
      const box = a.firstElementChild; let o = box.querySelector('[data-mapview]');
      if (map && !o) { o = document.createElement('div'); o.dataset.mapview = ''; o.style.cssText = 'position:absolute;inset:0'; o.innerHTML = window.KOTE_MAPS[a.dataset.route] || ''; const s = o.querySelector('svg'); if (s) { s.setAttribute('preserveAspectRatio', 'xMidYMid slice'); s.style.width = '100%'; s.style.height = '100%'; } box.style.position = 'relative'; box.appendChild(o); }
      if (o) o.style.display = map ? '' : 'none';
    });
  };
  if (mb && lb) { mb.addEventListener('click', () => view(true)); lb.addEventListener('click', () => view(false)); }
}
if (page === 'search' && $('[data-mg]')) {
  const MF = { g: 'all', r: 'all' }, cards = $$('article[data-g]');
  const run = () => { let n = 0; cards.forEach((c) => { const ok = (MF.g === 'all' || c.dataset.g === MF.g) && (MF.r === 'all' || c.dataset.reg === MF.r); c.style.display = ok ? 'flex' : 'none'; n += ok; });
    bind('m-count', n ? `${n} route${n === 1 ? '' : 's'} this summer` : 'No routes match'); bind('m-sorted', n ? 'Sorted by next departure' : 'Try another grade or region.'); };
  const set = (attr, key) => { const cs = $$(`[${attr}]`); cs.forEach((c) => c.addEventListener('click', () => { cs.forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF)); MF[key] = c.getAttribute(attr); run(); })); };
  set('data-mg', 'g'); set('data-mr', 'r');
}
if (page === 'trips') {
  $$('a[href="#"]').forEach((a) => { const row = a.closest('div[style*="grid"]') || a.parentElement, t = row.textContent;
    if (/Deposit/.test(t) && a.textContent.trim() === 'View') a.href = P('booked.html');
    if (/Travel to/.test(t)) a.href = routeUrl(TRIP.route);
    if (/Photos from/.test(a.textContent)) { const h = (a.nextElementSibling || {}).href; if (h) a.href = h; }
  });
}
if (page === 'agency') {
  const KP = { week: ['Bookings, this week', '14', '+3 on last week', 'Revenue booked', '€26,480', '€9,700 still to collect', 'Groups filled, July', '78%', '69 of 88 places', 'Waitlist', '23', '9 on Lyngen in July'],
    month: ['Bookings, November', '46', '+12 on October', 'Revenue booked', '€84,320', '€31,900 still to collect', 'Groups filled, summer', '71%', '113 of 160 places', 'Waitlist', '23', '9 on Lyngen in July'],
    season: ['Bookings, summer 2027', '128', '26 departures on sale', 'Revenue booked', '€241,900', '€96,300 still to collect', 'Groups filled, summer', '71%', '113 of 160 places', 'Waitlist', '23', '5 routes have a list'] };
  const h1 = $('main h1') || $('h1'), TT = { week: 'This week at a glance', month: 'Summer 2027 at a glance', season: 'The whole season at a glance' };
  const tiles = h1 ? [...h1.closest('main').querySelectorAll('div')].filter((d) => d.children.length === 3 && /font-size: 40px/.test(d.children[1].getAttribute('style') || '')) : [];
  $$('[data-range]').forEach((c) => { const n = c.cloneNode(true); c.replaceWith(n); });
  $$('[data-range]').forEach((c) => c.addEventListener('click', () => { $$('[data-range]').forEach((x) => press(x, x === c, CHIP_ON, CHIP_OFF)); const v = KP[c.dataset.range];
    tiles.forEach((t, i) => { [0, 1, 2].forEach((k) => { t.children[k].textContent = v[i * 3 + k]; }); }); if (h1) h1.textContent = TT[c.dataset.range]; }));
}
if (page === 'agency-bookings' && $('[data-pg-go]')) {
  let pg = 1; const all = $$('tbody tr'), rowPg = (r) => +(r.dataset.pg || 1);
  const active = () => { const c = $$('[data-st]').find((x) => x.getAttribute('aria-pressed') === 'true'); return c ? c.dataset.st : 'all'; };
  const paint = () => { const f = active();
    if (f === 'all') { all.forEach((r) => { r.style.display = rowPg(r) === pg ? '' : 'none'; }); bind('pg-n', pg === 1 ? '1 to 12 of 312' : '13 to 24 of 312'); }
    else bind('pg-n', `${all.filter((r) => r.style.display !== 'none').length} shown`);
    $$('[data-pg-go]').forEach((a) => { a.style.opacity = f !== 'all' || +a.dataset.pgGo === pg ? '.35' : '1'; }); };
  $$('[data-pg-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (active() !== 'all') return; pg = +a.dataset.pgGo; paint(); }));
  $$('[data-st]').forEach((c) => c.addEventListener('click', () => setTimeout(paint, 0)));
}
const byText = (t) => $$('button').filter((b) => b.textContent.trim() === t && !b.dataset.msgGuide);
byText('Message the guide').forEach((b) => { if (b.dataset.msgGuide === undefined) b.addEventListener('click', () => ask('Message the guide', 'Your guide reads messages in the evening when there is signal.', [{ l: 'Message', n: 'm', area: 1 }], 'Send', () => toast('Message written. Concept: it is not sent to anyone.', 4200))); });
if (page === 'agency-bookings') {
  const who = () => ((($('[data-drawer]') || document).querySelector('[data-b="dr-name"]') || {}).textContent || 'the traveller').trim();
  byText('Book the call').forEach((b) => b.addEventListener('click', () => toast('Call slot offered for the fitness call. Concept: nothing is sent.', 4200)));
  byText('Send reminder').forEach((b) => b.addEventListener('click', () => toast('Balance reminder drafted. Concept: no email is sent.', 4200)));
  byText('Move date').forEach((b) => b.addEventListener('click', () => ask('Move to another date', 'Moving is free until eight weeks before the start.', [{ l: 'New departure', n: 'd', opts: ['8 to 13 Jul, 3 places left', '5 to 10 Aug, 2 places left', '19 to 24 Aug, 5 places left'] }], 'Move', (v) => toast(`Moved to ${v.d.split(',')[0]}. Concept: nothing is stored.`, 4200))));
}
})();
