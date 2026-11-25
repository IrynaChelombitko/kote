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
const DEPS = [
  { d: '8 to 13 Jul', full: '8 to 13 July 2027', start: [2027, 6, 8], taken: 5, guide: 'Ingrid H.' },
  { d: '22 to 27 Jul', full: '22 to 27 July 2027', start: [2027, 6, 22], taken: 6, guide: 'Mats E.' },
  { d: '5 to 10 Aug', full: '5 to 10 August 2027', start: [2027, 7, 5], taken: 6, guide: 'Ingrid H.' },
  { d: '19 to 24 Aug', full: '19 to 24 August 2027', start: [2027, 7, 19], taken: 3, guide: 'Siri L.' },
];
const EXTRAS = [
  { k: 'crampons', name: 'crampons and axe', price: 40, per: true },
  { k: 'harness', name: 'harness and helmet', price: 30, per: true },
  { k: 'bag', name: 'sleeping bag', price: 40, per: true },
  { k: 'insurance', name: 'rescue insurance', price: 60, per: true },
  { k: 'tent', name: 'own tent at the lake', price: 35, per: false },
];
const PRICE = 2350, DEPOSIT = 400;
const def = { dep: 1, n: 2, share: true, ex: { crampons: 2, harness: 0, bag: 1, insurance: 0, tent: 0 }, pay: 'deposit', terms: true, saved: false };
let S;
try { S = Object.assign({}, def, JSON.parse(localStorage.getItem('kote') || '{}')); } catch (e) { S = Object.assign({}, def); }
S.ex = Object.assign({}, def.ex, S.ex || {});
const save = () => { try { localStorage.setItem('kote', JSON.stringify(S)); } catch (e) {} };
const dep = () => DEPS[S.dep];
const free = (i = S.dep) => 8 - DEPS[i].taken;
const eur = (v) => '€' + v.toLocaleString('en-US');
const words = ['No', 'One', 'Two', 'Three', 'Four'];
const extrasTotal = () => EXTRAS.reduce((a, x) => a + x.price * (S.ex[x.k] || 0), 0);
const total = () => PRICE * S.n + extrasTotal();
const depositDue = () => (S.pay === 'full' ? total() : DEPOSIT * S.n);
const dateOf = (a) => new Date(a[0], a[1], a[2]);
const fmtDay = (dt) => dt.getDate() + ' ' + dt.toLocaleString('en-GB', { month: 'long' });
const balanceDate = () => { const t = dateOf(dep().start); t.setDate(t.getDate() - 56); return fmtDay(t); };
const MAXN = () => Math.min(4, free());
if (S.n > MAXN()) S.n = Math.max(1, MAXN());

/* ---------- toast ---------- */
const toast = (html, ms = 3200) => {
  let t = $('.k-toast');
  if (!t) { t = document.createElement('div'); t.className = 'k-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = html; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms);
};
const SOON = 'Not part of this concept yet. Try search, the Lyngen route or booking.';
const ONLY_LYNGEN = `This concept has one full route page. <a href="${P('route-lyngen.html')}">Open Lyngen Alps</a>`;

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

/* ---------- mobile menu ---------- */
const menuBtn = $('[aria-label="Menu"]');
if (menuBtn) menuBtn.addEventListener('click', () => {
  let m = $('.k-menu');
  if (!m) {
    m = document.createElement('div'); m.className = 'k-menu';
    m.innerHTML = `<button type="button" class="k-menu-x" aria-label="Close menu">×</button>
      <a href="${P('index.html')}">Home</a><a href="${P('search.html')}">Routes</a><a href="${P('route-lyngen.html')}">Lyngen Alps traverse</a>
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
const paintSave = () => $$('[data-act="save"], [aria-label="Save"]').forEach((b) => {
  if (b.textContent.trim()) b.textContent = S.saved ? 'Saved' : 'Save';
  b.style.background = S.saved ? INK : 'transparent';
  const p = $('path', b); if (p) p.setAttribute('fill', S.saved ? INK : 'none');
  if (!b.textContent.trim()) b.style.background = 'transparent';
});
$$('[data-act="save"], [aria-label="Save"]').forEach((b) => b.addEventListener('click', () => { S.saved = !S.saved; save(); paintSave(); if (!b.textContent.trim() || true) b.style.color = S.saved && b.textContent.trim() ? SNOW : INK; toast(S.saved ? 'Saved to My trips' : 'Removed from saved'); }));
paintSave();
$$('[data-act="save"]').forEach((b) => { b.style.color = S.saved ? SNOW : INK; });

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
      a.style.display = ok ? '' : 'none';
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
  $$('[data-f-map]').forEach((b) => b.addEventListener('click', () => toast('The map view is not designed in this concept.')));
  $$('[data-f-update]').forEach((b) => b.addEventListener('click', () => { apply(); toast('Filters applied'); }));
  apply();
}

/* ================================================================ ROUTE */
if (page === 'route') {
  // day picker: profile and rows
  const pick = (i) => {
    $$('[data-prof]').forEach((p) => { p.style.display = +p.dataset.prof === i ? '' : 'none'; });
    $$('[data-day]').forEach((r) => { const on = +r.dataset.day === i; r.classList.toggle('k-day-on', on); const x = $('[data-day-more]', r); if (x) x.style.display = on ? '' : 'none'; });
    $$('[data-day-label]').forEach((t) => { t.setAttribute('font-weight', +t.dataset.dayLabel === i ? 700 : 400); });
  };
  $$('[data-day]').forEach((r) => r.addEventListener('click', () => pick(+r.dataset.day)));
  $$('[data-prof-hit]').forEach((h) => h.addEventListener('click', () => pick(+h.dataset.profHit)));
  pick(MOB ? 2 : 2);
  // booking panel
  const paintPanel = () => {
    $$('[data-dep]').forEach((b) => press(b, +b.dataset.dep === S.dep, CARD_ON, { background: 'transparent', border: '1px solid #14181A26' }));
    bind('n', S.n);
    bind('total', eur(PRICE * S.n));
    bind('total-label', `Total for ${S.n}`);
    $$('[data-book]').forEach((b) => { b.textContent = `Book ${S.n} place${S.n > 1 ? 's' : ''}`; });
  };
  $$('[data-dep]').forEach((b) => b.addEventListener('click', () => { S.dep = +b.dataset.dep; if (S.n > MAXN()) S.n = MAXN(); save(); paintPanel(); }));
  $$('[data-n]').forEach((b) => b.addEventListener('click', () => {
    const v = S.n + +b.dataset.n;
    if (v < 1) return;
    if (v > MAXN()) { toast(free() <= 4 ? `Only ${free()} place${free() > 1 ? 's' : ''} left on ${dep().d}` : 'One booking holds up to 4 people'); return; }
    S.n = v; save(); paintPanel();
  }));
  $$('[data-book]').forEach((b) => b.addEventListener('click', () => { save(); location.href = P('book-1.html'); }));
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

/* ================================================================ BOOKING */
if (page && page.startsWith('book')) {
  const step = +page.slice(4);
  const paintSummary = () => {
    bind('dates', S.dep === 1 ? '22 to 27 July 2027' : dep().full);
    $$('[data-mine-seats]').forEach((e) => setSeats(e, dep().taken, S.n, +e.dataset.mineSeats));
    let lines = `<div class="k-line"><span>${S.n} × Lyngen Alps traverse</span><span>${eur(PRICE * S.n)}</span></div>`;
    if (step >= 3) EXTRAS.forEach((x) => { const q = S.ex[x.k] || 0; if (q) lines += `<div class="k-line"><span>${q} × ${x.name}</span><span>${eur(q * x.price)}</span></div>`; });
    bind('lines', lines);
    const t = step >= 3 ? total() : PRICE * S.n;
    bind('sum-total', eur(t));
    bind('sum-deposit', eur(DEPOSIT * S.n));
    bind('sum-balance', eur(t - DEPOSIT * S.n));
    bind('sum-due', `Balance by ${balanceDate()}`);
    bind('n-travellers', `${S.n} traveller${S.n > 1 ? 's' : ''}`);
    bind('n', S.n);
    bind('m-total', eur(t));
  };
  // step 1
  $$('[data-dep-card]').forEach((c) => c.addEventListener('click', () => { S.dep = +c.dataset.depCard; if (S.n > MAXN()) S.n = MAXN(); save(); paint1(); }));
  const paint1 = () => {
    $$('[data-dep-card]').forEach((c) => {
      const i = +c.dataset.depCard, on = i === S.dep;
      press(c, on, CARD_ON, CARD_OFF);
      setSeats($('[data-seats]', c), DEPS[i].taken, on ? S.n : 0, +$('[data-seats]', c).dataset.seats);
      const f = 8 - DEPS[i].taken;
      $('[data-left]', c).textContent = on ? (S.n === f ? `The last ${f === 1 ? 'place' : f + ' places'}, yours` : `${S.n} yours, ${f - S.n} still free`) : `${f} place${f > 1 ? 's' : ''} left`;
      $('[data-left]', c).style.fontWeight = on ? '700' : '400';
    });
    paintSummary();
  };
  $$('[data-n]').forEach((b) => b.addEventListener('click', () => {
    const v = S.n + +b.dataset.n;
    if (v < 1) return;
    if (v > MAXN()) { toast(free() < 4 ? `Only ${free()} place${free() > 1 ? 's' : ''} left on ${dep().d}. Pick another date for more.` : 'One booking holds up to 4 people'); return; }
    S.n = v; save(); paint1(); paintT2();
  }));
  // step 2: second traveller block follows the count
  const paintT2 = () => { $$('[data-t2]').forEach((e) => { e.style.display = S.n > 1 ? '' : 'none'; }); bind('t2-label', S.n > 2 ? `Traveller 2 <span style="font-weight:400;font-size:15px;color:#4A5458">(and ${S.n - 2} more, we email them the same form)</span>` : 'Traveller 2'); };
  // step 3 extras
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
    b.textContent = 'Booking…'; setTimeout(() => { location.href = P('booked.html'); }, 700);
  }));
  $$('label[data-share]').forEach((l) => { setCheck(l, S.share); l.addEventListener('k-change', () => { S.share = !!l.dataset.on; save(); }); });
  $$('label[data-terms]').forEach((l) => setCheck(l, S.terms));
  if (step === 1) paint1();
  if (step === 2) { paintT2(); paintSummary(); }
  if (step === 3) paint3();
  if (step === 4) { paint4(); paintSummary(); }
}

/* ================================================================ BOOKED */
if (page === 'booked') {
  const n = S.n, d = dep();
  const code = 'KT-27-' + String(d.start[1] + 1).padStart(2, '0') + String(d.start[2]).padStart(2, '0') + '-14';
  bind('code', 'Booking ' + code);
  bind('headline', `You are in.<br>${words[n]} place${n > 1 ? 's' : ''} on<br>the Lyngen ridge.`);
  $$('[data-big-seats]').forEach((e) => { let h = ''; for (let i = 0; i < 8; i++) h += `<span style="display:block;width:${e.dataset.bigSeats}px;height:${e.dataset.bigSeats}px;box-sizing:border-box;${i < d.taken ? 'background:' + INK : i < d.taken + n ? 'background:' + ORANGE : 'border:2px solid ' + INK}"></span>`; e.innerHTML = h; });
  const left = 8 - d.taken - n;
  bind('seat-note', `The orange square${n > 1 ? 's are' : ' is'} you. ${left ? left + ' place' + (left > 1 ? 's' : '') + ' still open.' : 'The group is full.'}`);
  const st = dateOf(d.start), call = new Date(st); call.setDate(call.getDate() - 59); const meet = new Date(st); meet.setDate(meet.getDate() - 1);
  bind('next-call-date', 'Week of ' + fmtDay(call));
  bind('next-call', `${d.guide.split(' ')[0]}, your guide, calls ${n === 2 ? 'you both' : n > 2 ? 'you all' : 'you'}. 20 minutes.`);
  bind('next-bal-date', balanceDate());
  bind('next-bal', S.pay === 'full' ? 'Nothing left to pay. Paid in full today.' : `Balance ${eur(total() - DEPOSIT * n)} due. We remind you a week before.`);
  bind('next-meet-date', fmtDay(meet) + ', 18:00');
  $$('[data-ics]').forEach((b) => b.addEventListener('click', () => {
    const p = (x) => String(x).padStart(2, '0');
    const s = dateOf(d.start), e = new Date(s); e.setDate(e.getDate() + 6);
    const f = (x) => x.getFullYear() + p(x.getMonth() + 1) + p(x.getDate());
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kote concept//EN', 'BEGIN:VEVENT', 'UID:' + code + '@kote.concept', 'DTSTART;VALUE=DATE:' + f(s), 'DTEND;VALUE=DATE:' + f(e),
      'SUMMARY:Lyngen Alps traverse (Kote concept)', 'LOCATION:Lyngseidet, Norway', 'DESCRIPTION:Concept prototype by Iryna Chelombitko. Not a real trip.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'kote-lyngen.ics'; a.click();
  }));
}

/* ================================================================ MY TRIPS */
if (page === 'trips') {
  const d = dep();
  const days = Math.max(0, Math.ceil((dateOf(d.start) - new Date()) / 86400000));
  bind('days', days);
  bind('trip-line', `${d.full.replace(' 2027', ' 2027')}, guide ${d.guide}`);
  bind('trip-n', `Next trip, ${S.n} traveller${S.n > 1 ? 's' : ''}`);
  bind('bal-due', `Due ${balanceDate()}`);
  bind('bal-btn', S.pay === 'full' ? 'Paid in full' : 'Pay balance');
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
})();
