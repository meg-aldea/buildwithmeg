document.documentElement.classList.add("js");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hero: split headline into words so they can stagger in
const hero = document.querySelector(".hero");
if (hero) {
  let i = 0;
  hero.querySelectorAll("h1 [data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, n) => {
      const s = document.createElement("span");
      s.className = "w";
      s.style.setProperty("--i", i++);
      s.textContent = w;
      el.appendChild(s);
      if (n < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });
  // On the landing page the hero waits below a screen of dots: animate it in as it arrives.
  if (document.querySelector(".intro-space") && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { hero.classList.add("go"); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(hero);
  } else requestAnimationFrame(() => hero.classList.add("go"));
}

// Scroll reveal
const reveals = document.querySelectorAll(".reveal");
if (reduce || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

// Count-up numbers: <span data-count="28" data-decimals="0" data-suffix="%">
const counters = document.querySelectorAll("[data-count]");
const runCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const dur = 1200;
  const step = (t) => {
    const p = Math.min((t - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if (reduce || !("IntersectionObserver" in window)) {
  counters.forEach((el) => {
    el.textContent = parseFloat(el.dataset.count).toFixed(parseInt(el.dataset.decimals || "0", 10)) + (el.dataset.suffix || "");
  });
} else {
  // start every counter at zero right away so the count-up is always visible
  counters.forEach((el) => {
    el.textContent = (0).toFixed(parseInt(el.dataset.decimals || "0", 10)) + (el.dataset.suffix || "");
  });
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCount(e.target);
          cio.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => cio.observe(el));
}

// About page: highlight current chapter in the side nav
const tocLinks = document.querySelectorAll(".toc a");
if (tocLinks.length && "IntersectionObserver" in window) {
  const map = new Map([...tocLinks].map((a) => [a.getAttribute("href").slice(1), a]));
  const tio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove("on"));
          map.get(e.target.id)?.classList.add("on");
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  document.querySelectorAll(".chapter[id]").forEach((c) => tio.observe(c));
}

const yr = document.getElementById("yr");
if (yr) yr.textContent = new Date().getFullYear();

// Portfolio filters (also reads ?f=ai / ?f=edtech)
const filters = document.querySelectorAll(".filter");
if (filters.length) {
  const projects = document.querySelectorAll(".project[data-track]");
  const apply = (f) => {
    filters.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
    projects.forEach((p) => {
      p.hidden = f !== "all" && !p.dataset.track.split(" ").includes(f);
      if (!p.hidden) p.classList.add("in");
    });
    document.querySelectorAll(".pgroup").forEach((g) => {
      g.hidden = !g.querySelector(".project:not([hidden])");
      if (!g.hidden) g.querySelectorAll(".reveal").forEach((r) => r.classList.add("in"));
    });
  };
  filters.forEach((b) => b.addEventListener("click", () => apply(b.dataset.f)));
  const q = new URLSearchParams(location.search).get("f");
  if (q === "ai" || q === "edtech") apply(q);
}


// Email links: the address is assembled only on click (never in the page source).
// Clicking tries the visitor's mail app AND shows a small panel with copy + Gmail,
// because mailto: silently does nothing when no mail app is set up.
document.querySelectorAll(".email-link").forEach((a) => {
  a.setAttribute("aria-expanded", "false");
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const addr = a.dataset.u + "@" + a.dataset.d;
    let panel = a.parentElement.querySelector(".email-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "email-panel";
      panel.setAttribute("role", "status");
      panel.innerHTML =
        '<span class="addr"></span>' +
        '<button type="button" class="copy">Copy address</button>' +
        '<a class="gmail" target="_blank" rel="noopener">Open in Gmail ↗</a>';
      panel.querySelector(".addr").textContent = addr;
      panel.querySelector(".gmail").href = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(addr);
      const copy = panel.querySelector(".copy");
      copy.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(addr); copy.textContent = "Copied ✓"; }
        catch (err) {
          const r = document.createRange(); r.selectNodeContents(panel.querySelector(".addr"));
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); copy.textContent = "Press ⌘C to copy";
        }
        setTimeout(() => (copy.textContent = "Copy address"), 2500);
      });
      a.parentElement.appendChild(panel);
    }
    panel.hidden = false;
    a.setAttribute("aria-expanded", "true");
    window.location.href = "mailto:" + addr;
  });
});

// testimonials carousel
document.querySelectorAll('.carousel').forEach((car) => {
  const track = car.querySelector('.car-track');
  const slides = [...track.children];
  const dots = car.querySelector('.car-dots');
  let cur = 0, lock = 0;
  const go = (i) => { cur = (i + slides.length) % slides.length; lock = Date.now() + 700; mark(); track.scrollTo({ left: slides[cur].offsetLeft - track.offsetLeft }); };
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.type = 'button'; d.setAttribute('role', 'tab'); d.setAttribute('aria-label', `Testimonial ${i + 1}`);
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  });
  const mark = () => [...dots.children].forEach((d, i) => d.setAttribute('aria-selected', i === cur));
  track.addEventListener('scroll', () => { if (Date.now() < lock) return; cur = Math.round(track.scrollLeft / track.clientWidth); mark(); }, { passive: true });
  car.querySelector('.car-prev').addEventListener('click', () => go(cur - 1));
  car.querySelector('.car-next').addEventListener('click', () => go(cur + 1));
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
  mark();
});

// Left rail nav: scroll-progress line, phone menu toggle, and (landing only)
// hidden while the dots-only opening screen is showing.
(() => {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const wrap = nav.querySelector(".wrap");
  const prog = document.createElement("div");
  prog.className = "rail-progress"; prog.setAttribute("aria-hidden", "true");
  prog.appendChild(document.createElement("i"));
  wrap.appendChild(prog);

  const btn = document.createElement("button");
  btn.className = "menu-btn"; btn.type = "button";
  btn.setAttribute("aria-label", "Menu"); btn.setAttribute("aria-expanded", "false");
  btn.appendChild(document.createElement("span"));
  wrap.insertBefore(btn, wrap.querySelector("nav"));
  const setOpen = (o) => { nav.classList.toggle("open", o); btn.setAttribute("aria-expanded", o); document.documentElement.style.overflow = o ? "hidden" : ""; };
  btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  const intro = document.querySelector(".intro-space");
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max) : 0);
    if (intro) document.body.classList.toggle("rail-off", scrollY < intro.offsetHeight * 0.6 && !nav.classList.contains("open"));
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
})();
