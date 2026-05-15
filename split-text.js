(function () {
  const el = document.querySelector(".split-text");
  if (!el) return;

  const text = el.textContent.trim();
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staggerMs = 50;
  const baseDelayMs = 150;

  if (prefersReduced) {
    el.classList.add("split-text--ready");
    return;
  }

  el.setAttribute("aria-label", text);
  el.textContent = "";

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "split-char";
    span.setAttribute("aria-hidden", "true");
    span.textContent = char === " " ? "\u00a0" : char;
    span.style.animationDelay = `${(baseDelayMs + index * staggerMs) / 1000}s`;
    el.appendChild(span);
  });

  const start = () => el.classList.add("split-text--animate");

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    start();
  }
})();
