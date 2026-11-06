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
  requestAnimationFrame(() => hero.classList.add("go"));
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
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCount(e.target);
          cio.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
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
  };
  filters.forEach((b) => b.addEventListener("click", () => apply(b.dataset.f)));
  const q = new URLSearchParams(location.search).get("f");
  if (q === "ai" || q === "edtech") apply(q);
}
