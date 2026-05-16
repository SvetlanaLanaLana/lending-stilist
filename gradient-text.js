(function () {
  const DEFAULT_COLORS = ["#6d4285", "#a970b8", "#e8b4d4"];
  const DEFAULT_SPEED = 8;

  const parseColors = (raw) => {
    if (!raw) return DEFAULT_COLORS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_COLORS;
    } catch {
      return raw.split(",").map((c) => c.trim()).filter(Boolean);
    }
  };

  const buildGradient = (colors) => {
    const looped = [...colors, colors[0]].join(", ");
    return `linear-gradient(to right, ${looped})`;
  };

  const initElements = () => {
    const nodes = document.querySelectorAll("[data-gradient-text]");
    nodes.forEach((el) => {
      const colors = parseColors(el.dataset.gradientColors);
      const speed = Number(el.dataset.gradientSpeed) || DEFAULT_SPEED;
      el.style.setProperty("--gt-gradient", buildGradient(colors));
      el.dataset.gradientDuration = String(speed * 1000);
    });
    return nodes;
  };

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const startAnimation = (nodes) => {
    if (!nodes.length || prefersReduced) return;

    const durations = [...nodes].map((el) => Number(el.dataset.gradientDuration) || DEFAULT_SPEED * 1000);

    let elapsed = 0;
    let lastTime = null;

    const tick = (time) => {
      if (lastTime === null) {
        lastTime = time;
      } else {
        elapsed += time - lastTime;
        lastTime = time;
      }

      nodes.forEach((el, index) => {
        const duration = durations[index];
        const fullCycle = duration * 2;
        const cycleTime = elapsed % fullCycle;
        let progress;

        if (cycleTime < duration) {
          progress = (cycleTime / duration) * 100;
        } else {
          progress = 100 - ((cycleTime - duration) / duration) * 100;
        }

        el.style.setProperty("--gt-pos", `${progress}%`);
      });

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const boot = () => {
    const nodes = initElements();
    startAnimation(nodes);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(boot, 350);
    });
  } else {
    window.setTimeout(boot, 350);
  }
})();
