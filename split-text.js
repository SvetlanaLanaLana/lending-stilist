(function () {
  const el = document.querySelector("[data-split-text]");
  if (!el) return;

  const lineEls = el.querySelectorAll(".split-line");
  const originalHTML = el.innerHTML;
  const originalLabel = lineEls.length
    ? [...lineEls].map((line) => line.textContent.trim()).join(" ")
    : el.textContent.trim();

  if (!originalLabel) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const staggerMs = 50;
  const baseDelayMs = 150;

  function restoreText() {
    el.innerHTML = originalHTML;
    el.classList.remove("split-text--animate");
  }

  function splitIntoChars(container, text, startIndex) {
    let index = startIndex;

    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "split-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = char === " " ? "\u00a0" : char;
      span.style.animationDelay = `${(baseDelayMs + index * staggerMs) / 1000}s`;
      container.appendChild(span);
      index += 1;
    });

    return index;
  }

  function runSplit() {
    try {
      el.setAttribute("aria-label", originalLabel);
      let charIndex = 0;

      if (lineEls.length) {
        lineEls.forEach((line) => {
          const text = line.textContent.trim();
          line.textContent = "";
          charIndex = splitIntoChars(line, text, charIndex);
        });
      } else {
        el.textContent = "";
        splitIntoChars(el, originalLabel, 0);
      }

      requestAnimationFrame(() => {
        el.classList.add("split-text--animate");
      });
    } catch {
      restoreText();
    }
  }

  function waitForFonts() {
    const timeout = new Promise((resolve) => {
      window.setTimeout(resolve, 300);
    });

    if (!document.fonts || !document.fonts.ready) {
      return timeout;
    }

    return Promise.race([document.fonts.ready.catch(() => {}), timeout]);
  }

  waitForFonts().then(runSplit);
})();
