// Kote screens -> editable Figma layers. Loaded in Scripter with:
//   globalThis.__K = { SLUGS: [...], PAGE: 'Desktop', print, fetch }; await eval(await (await fetch(BASE + 'build.js')).text())
(async () => {
  const { SLUGS, PAGE, print, fetch } = globalThis.__K;
  const BASE = 'https://irynachelombitko.github.io/kote/fig/';
  const log = [];
  const errs = [];
  const t0 = Date.now();

  // ---------- pages
  const PAGES = ['Desktop', 'Mobile', 'Agency', 'Case slides'];
  const pages = figma.root.children;
  for (let i = 0; i < PAGES.length && i < pages.length; i++) {
    if (!PAGES.includes(pages[i].name)) pages[i].name = PAGES[i];
  }
  let page = figma.root.children.find(p => p.name === PAGE);
  if (!page) { page = figma.createPage(); page.name = PAGE; }
  await figma.setCurrentPageAsync(page);

  // ---------- colour variables
  const PALETTE = { Basalt: '#14181A', Snow: '#F3F5F4', Fog: '#E2E7E6', Rock: '#8B9497', Signal: '#F25C05', 'Basalt 70': '#4A5458', White: '#FFFFFF' };
  let coll = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Kote');
  if (!coll) coll = figma.variables.createVariableCollection('Kote');
  const vars = {};
  const existing = await figma.variables.getLocalVariablesAsync('COLOR');
  const hex2rgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
  for (const [name, hex] of Object.entries(PALETTE)) {
    let v = existing.find(x => x.name === 'colour/' + name && x.variableCollectionId === coll.id);
    if (!v) {
      v = figma.variables.createVariable('colour/' + name, coll, 'COLOR');
      v.setValueForMode(coll.modes[0].modeId, Object.assign(hex2rgb(hex), { a: 1 }));
      v.scopes = ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR'];
    }
    vars[hex] = v;
  }
  const paint = c => {
    let p = { type: 'SOLID', color: hex2rgb(c.h), opacity: c.a };
    const v = vars[c.h];
    if (v) p = figma.variables.setBoundVariableForPaint(p, 'color', v);
    return p;
  };

  // ---------- fonts
  const fontCache = {};
  const font = async (st) => {
    if (!fontCache[st]) { await figma.loadFontAsync({ family: 'Archivo', style: st }); fontCache[st] = 1; }
  };
  const fname = (st, wd) => (wd ? { family: 'Archivo', style: st, variationSettings: { wdth: wd } } : { family: 'Archivo', style: st });

  // ---------- images
  const imgCache = {};
  const image = async (url) => {
    if (!imgCache[url]) {
      const r = await fetch(url);
      if (!r.ok) throw new Error('image ' + r.status + ' ' + url);
      imgCache[url] = figma.createImage(new Uint8Array(await r.arrayBuffer())).hash;
    }
    return imgCache[url];
  };

  const polyPath = pts => 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L') + ' Z';
  const polyVector = (pts, w, h) => {
    const wrap = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${polyPath(pts)}" fill="#000000"/></svg>`);
    const v = wrap.children[0];
    return { v, wrap, vx: v.x, vy: v.y };
  };
  const setRadius = (n, r) => {
    if (!r) return;
    if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3]) n.cornerRadius = r[0];
    else { n.topLeftRadius = r[0]; n.topRightRadius = r[1]; n.bottomRightRadius = r[2]; n.bottomLeftRadius = r[3]; }
  };
  const setStroke = (n, sk) => {
    if (!sk) return;
    n.strokes = [paint(sk.c)];
    n.strokeAlign = sk.out ? 'OUTSIDE' : 'INSIDE';
    const w = sk.w;
    if (w[0] === w[1] && w[1] === w[2] && w[2] === w[3]) n.strokeWeight = w[0];
    else if ('strokeTopWeight' in n) { n.strokeTopWeight = w[0]; n.strokeRightWeight = w[1]; n.strokeBottomWeight = w[2]; n.strokeLeftWeight = w[3]; }
    else n.strokeWeight = Math.max(...w);
    if (sk.dash) n.dashPattern = [4, 4];
  };
  const setFx = (n, d) => {
    if (d.sh) n.effects = d.sh.map(s => ({ type: 'DROP_SHADOW', color: Object.assign(hex2rgb(s.c.h), { a: s.c.a }), offset: { x: s.x, y: s.y }, radius: s.b, spread: s.s, visible: true, blendMode: 'NORMAL' }));
    if (d.op !== undefined) n.opacity = d.op;
  };
  const place = (n, d, parent) => { parent.appendChild(n); n.x = d.x; n.y = d.y; };
  const TAGS = { div: 'Frame', section: 'Section', header: 'Header', footer: 'Footer', nav: 'Navigation', aside: 'Aside', figure: 'Figure', form: 'Form', button: 'Button', a: 'Link', ul: 'List', ol: 'List', li: 'Item', span: 'Shape', p: 'Paragraph', label: 'Label', h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', main: 'Main', article: 'Card', figcaption: 'Caption', field: 'Input', table: 'Table', tr: 'Row', td: 'Cell', th: 'Cell', strong: 'Shape', b: 'Shape', i: 'Shape' };
  const firstBig = (d) => {
    let best = null;
    const walk = n => { if (best) return; if (n.t === 'T' && n.segs[0].sz >= 24) { best = n.chars; return; } (n.ch || []).forEach(walk); };
    walk(d); return best;
  };
  const niceName = (d) => {
    const raw = d.n || 'Frame';
    let base = TAGS[raw] || (raw.startsWith('k-') ? raw.slice(2).replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()) : raw);
    if (['Section', 'Header', 'Footer', 'Aside', 'Main', 'Card', 'Form', 'Figure'].includes(base)) {
      const t = firstBig(d); if (t) base += ' · ' + t.replace(/\s+/g, ' ').slice(0, 36);
    } else if ((base === 'Button' || base === 'Link') && d.ch && d.ch.length === 1 && d.ch[0].t === 'T') base += ' · ' + d.ch[0].chars.slice(0, 30);
    return base;
  };

  const build = async (d, parent) => {
    try {
      if (d.t === 'F' || d.t === 'R') {
        let n;
        if (d.t === 'R' && !d.poly) n = figma.createRectangle();
        else if (d.t === 'R' && d.poly) { const pv = polyVector(d.poly, d.w, d.h); n = pv.v; parent.appendChild(n); pv.wrap.remove(); d = Object.assign({}, d, { x: d.x + pv.vx, y: d.y + pv.vy }); }
        else { n = figma.createFrame(); n.clipsContent = !!d.clip; }
        n.name = niceName(d);
        place(n, d, parent);
        if (!(d.t === 'R' && d.poly)) n.resize(Math.max(0.01, d.w), Math.max(0.01, d.h));
        n.fills = d.fill ? [paint(d.fill)] : [];
        if (d.bgimg) n.fills = [{ type: 'IMAGE', imageHash: await image(d.bgimg), scaleMode: 'FILL' }];
        setRadius(n, d.r); setStroke(n, d.sk); setFx(n, d);
        if (d.t === 'F' && d.poly) {
          const pv = polyVector(d.poly, d.w, d.h);
          n.appendChild(pv.v); pv.v.x = pv.vx; pv.v.y = pv.vy; pv.v.isMask = true; pv.v.name = 'Profile mask'; pv.wrap.remove();
          if (d.fill) { const bg = figma.createRectangle(); n.appendChild(bg); bg.resize(d.w, d.h); bg.fills = [paint(d.fill)]; bg.name = 'Background'; n.fills = []; }
        }
        if (d.ch) for (const c of d.ch) await build(c, n);
        return n;
      }
      if (d.t === 'I') {
        let n;
        if (d.poly) { const pv = polyVector(d.poly, d.w, d.h); n = pv.v; parent.appendChild(n); pv.wrap.remove(); n.x = d.x + pv.vx; n.y = d.y + pv.vy; }
        else { n = figma.createRectangle(); place(n, d, parent); n.resize(Math.max(0.01, d.w), Math.max(0.01, d.h)); }
        n.name = d.n || 'Photo';
        const p = { type: 'IMAGE', imageHash: await image(d.url), scaleMode: d.fit || (d.crop ? 'CROP' : 'FILL') };
        if (d.crop && !d.poly) p.imageTransform = [[d.crop[0], 0, d.crop[2]], [0, d.crop[1], d.crop[3]]];
        n.fills = [p];
        setRadius(n, d.r); setFx(n, d);
        return n;
      }
      if (d.t === 'S') {
        const n = figma.createNodeFromSvg(d.svg);
        n.name = d.n || 'Graphic';
        parent.appendChild(n);
        n.fills = []; n.clipsContent = false;
        if (d.tf) {
          const [a, b, c, dd] = d.tf;
          n.relativeTransform = [[a, c, d.cx - (a * d.w / 2 + c * d.h / 2)], [b, dd, d.cy - (b * d.w / 2 + dd * d.h / 2)]];
        } else { n.x = d.x; n.y = d.y; }
        if (d.op !== undefined) n.opacity = d.op;
        const texts = n.findAll(x => x.type === 'TEXT');
        for (const t of texts) {
          const f = t.fontName;
          if (f === figma.mixed) continue;
          let st = f.style;
          if (f.family !== 'Archivo') { st = 'Bold'; }
          await font(st);
          await figma.loadFontAsync(f);
          t.fontName = fname(st, d.cond || 0);
        }
        return n;
      }
      if (d.t === 'T') {
        const n = figma.createText();
        for (const s of d.segs) await font(s.st);
        const s0 = d.segs[0];
        n.fontName = fname(s0.st, s0.wd);
        n.characters = d.chars;
        n.fontSize = s0.sz;
        n.fills = [paint(s0.c)];
        if (s0.ls) n.letterSpacing = { unit: 'PIXELS', value: s0.ls };
        for (const s of d.segs.slice(1)) {
          n.setRangeFontName(s.s, s.e, fname(s.st, s.wd));
          if (s.sz !== s0.sz) n.setRangeFontSize(s.s, s.e, s.sz);
          if (s.c.h !== s0.c.h || s.c.a !== s0.c.a) n.setRangeFills(s.s, s.e, [paint(s.c)]);
          if (s.ls !== s0.ls) n.setRangeLetterSpacing(s.s, s.e, { unit: 'PIXELS', value: s.ls });
        }
        for (const s of d.segs) if (s.u) n.setRangeTextDecoration(s.s, s.e, 'UNDERLINE');
        n.lineHeight = d.lh ? { unit: 'PIXELS', value: d.lh } : { unit: 'AUTO' };
        n.textAlignHorizontal = d.al;
        parent.appendChild(n);
        if (d.auto) { n.textAutoResize = 'WIDTH_AND_HEIGHT'; n.textAlignHorizontal = 'LEFT'; }
        else { n.resize(Math.max(1, d.w), n.height); n.textAutoResize = 'HEIGHT'; if (d.ind) n.paragraphIndent = d.ind; }
        n.x = d.x;
        n.y = d.vc ? (d.vc - n.height) / 2 : d.y;
        return n;
      }
    } catch (e) {
      errs.push((d.n || d.t) + ': ' + (e && e.message || e));
    }
  };

  // ---------- screens
  const made = [];
  let x = 0;
  for (const n of page.children) x = Math.max(x, n.x + n.width + 200);
  for (const slug of SLUGS) {
    const d = await (await fetch(BASE + slug + '.json?' + Date.now())).json();
    const old = page.children.find(n => n.name === d.name && n.type === 'FRAME');
    let X = x, Y = 0;
    if (old) { X = old.x; Y = old.y; old.remove(); }
    const root = figma.createFrame();
    root.name = d.name;
    root.resize(d.w, d.h);
    root.x = X; root.y = Y;
    root.fills = d.fill ? [paint(d.fill)] : [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    root.clipsContent = true;
    for (const c of d.ch) await build(c, root);
    made.push(root.id);
    if (!old) x += d.w + (d.w < 500 ? 80 : 200);
    log.push(slug + ' ok');
  }
  print(log.join(', '), '| errors:', errs.length, errs.slice(0, 12).join(' || '), '| sec', Math.round((Date.now() - t0) / 1000));
  return made;
})()
