// Landing page background: the page opens on nothing but dots; scrolling brings
// the hero up. The field stays behind everything, drifting up as you scroll,
// bright behind the hero and dimmed behind the sections below.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Robotic, not sparkly: white dots in a few quantized shades that switch in
  // discrete ticks, booting up row by row, with a slow scanline passing down.
  const SHADES = [0.12, 0.28, 0.5, 0.85];
  // Now and then a dot lights up in one of the two accent colors (shirt blue, pastel coral).
  const TINTS = ["255,255,255", "159,180,222", "229,138,128"];
  const ACCENT = 0.035;
  function dotField(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const o = Object.assign({ gap: 26, r: 2.1, gain: 1, scan: true, boot: true, depth: 0.55 }, opts);
    let w, h, cols, rows, grid = [], base = 0, raf, t0 = performance.now(), running = true;
    const cell = () => ({ s: (Math.random() * 2) | 0, c: 0, next: 0, rate: 0.6 + Math.random() * 2.4 });
    const row = () => Array.from({ length: cols }, cell);

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The canvas covers the viewport; Safari can report its CSS size as 300x150 before
      // layout settles, so measure the window instead.
      w = canvas.clientWidth || innerWidth; h = canvas.clientHeight || innerHeight;
      if (w < innerWidth * 0.9 || h < innerHeight * 0.5) { w = innerWidth; h = innerHeight; }
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / o.gap); rows = Math.ceil(h / o.gap) + 2;
      grid = Array.from({ length: rows }, row);
    }

    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      // travel: the field drifts up as the page scrolls, slower than the content
      const travel = scrollY * o.depth;
      const nb = Math.floor(travel / o.gap);
      if (nb !== base) {                                     // recycle rows that left the screen
        const d = nb - base; base = nb;
        if (Math.abs(d) >= rows) grid = Array.from({ length: rows }, row);
        else if (d > 0) { grid.splice(0, d); for (let i = 0; i < d; i++) grid.push(row()); }
        else { grid.splice(rows + d, -d); for (let i = 0; i < -d; i++) grid.unshift(row()); }
      }
      const oy = travel - base * o.gap;
      const scanY = o.scan ? ((t * 0.22) % 1.3 - 0.15) * h : -1e9;
      for (let r = 0; r < rows; r++) {
        if (o.boot && t * 14 < r) break;                     // rows switch on top to bottom
        const y = o.gap / 2 + r * o.gap - oy;
        if (y < -o.gap || y > h + o.gap) continue;
        const near = Math.max(0, 1 - Math.abs(y - scanY) / (o.gap * 1.5));
        const bump = near > 0.5 ? 2 : near > 0 ? 1 : 0;
        const line = grid[r];
        for (let c = 0; c < cols; c++) {
          const p = line[c];
          if (t > p.next) {                                    // discrete state change
            p.next = t + p.rate * (0.5 + Math.random());
            p.s = Math.random() < 0.7 ? (Math.random() * 2) | 0 : 2 + ((Math.random() * 2) | 0);
            p.c = Math.random() < ACCENT ? 1 + ((Math.random() * 2) | 0) : 0;
            if (p.c) p.s = 3;                                  // accent dots show at full shade
          }
          ctx.fillStyle = `rgba(${TINTS[p.c]},${SHADES[Math.min(3, p.s + bump)] * o.gain})`;
          ctx.fillRect(o.gap / 2 + c * o.gap - o.r, y - o.r, o.r * 2, o.r * 2);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    addEventListener("resize", size);
    addEventListener("load", size);
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(canvas);
    raf = requestAnimationFrame(frame);
    return {
      setGain(g) { o.gain = g; },
      drawOnce() { const r = running; running = true; frame(performance.now()); cancelAnimationFrame(raf); running = r; },
      pause() { running = false; cancelAnimationFrame(raf); },
      play() { if (!running) { running = true; raf = requestAnimationFrame(frame); } },
      stop() { running = false; cancelAnimationFrame(raf); removeEventListener("resize", size); },
    };
  }

  // One fixed dot field behind the whole landing page: full strength behind the
  // hero, dimming as the hero scrolls away, then staying on, quietly, to the end.
  const canvas = document.querySelector(".bg-dots");
  const hero = document.querySelector(".hero");
  if (canvas) {
    const f = dotField(canvas, { boot: !reduce, scan: !reduce, depth: reduce ? 0 : 0.55 });
    if (reduce) setTimeout(() => f.pause(), 60);
    const DIM = 0.22, FULL = 0.8;
    const dim = () => {
      const vh = innerHeight, r = hero ? hero.getBoundingClientRect() : { top: 0, bottom: 0 };
      if (r.top > 0) f.setGain(FULL + (1 - FULL) * Math.min(1, r.top / vh));   // opening screen: full strength
      else {
        const k = Math.min(1, Math.max(0, (r.bottom - vh * 0.25) / (vh * 0.55)));
        f.setGain(DIM + (FULL - DIM) * k);
      }
      if (reduce) f.drawOnce();
    };
    addEventListener("scroll", dim, { passive: true });
    addEventListener("resize", dim);
    dim();
  }
})();
