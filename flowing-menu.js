(function () {
  const root = document.querySelector("[data-flowing-menu]");
  if (!root) return;

  const speed = Number(root.dataset.speed) || 18;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = root.querySelectorAll("[data-flowing-item]");

  const distMetric = (x, y, x2, y2) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const buildMarquee = (inner, text, image) => {
    inner.textContent = "";

    const part = document.createElement("div");
    part.className = "flowing-menu__part";

    const label = document.createElement("span");
    label.textContent = text;

    const img = document.createElement("div");
    img.className = "flowing-menu__img";
    img.style.backgroundImage = `url("${image}")`;

    part.append(label, img);

    const copies = prefersReduced ? 1 : 6;
    for (let i = 0; i < copies; i += 1) {
      inner.appendChild(part.cloneNode(true));
    }

    if (!prefersReduced) {
      requestAnimationFrame(() => {
        const firstPart = inner.querySelector(".flowing-menu__part");
        if (!firstPart) return;
        const width = firstPart.getBoundingClientRect().width;
        if (width > 0) {
          inner.style.setProperty("--marquee-shift", `-${width}px`);
          inner.style.setProperty("--marquee-duration", `${speed}s`);
        }
      });
    }
  };

  items.forEach((item) => {
    const link = item.querySelector(".flowing-menu__link");
    const marquee = item.querySelector(".flowing-menu__marquee");
    const inner = item.querySelector("[data-marquee-inner]");
    if (!link || !marquee || !inner) return;

    const text = link.dataset.text || link.textContent.trim();
    const image = link.dataset.image || "";

    buildMarquee(inner, text, image);

    if (prefersReduced) return;

    const onEnter = (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      item.classList.remove(
        "is-active",
        "is-enter-top",
        "is-enter-bottom",
        "is-leave-top",
        "is-leave-bottom"
      );
      item.classList.add(edge === "top" ? "is-enter-top" : "is-enter-bottom");

      requestAnimationFrame(() => {
        item.classList.add("is-active");
      });
    };

    const onLeave = (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      item.classList.remove("is-active", "is-enter-top", "is-enter-bottom");
      item.classList.add(edge === "top" ? "is-leave-top" : "is-leave-bottom");

      window.setTimeout(() => {
        item.classList.remove("is-leave-top", "is-leave-bottom");
      }, 650);
    };

    link.addEventListener("mouseenter", onEnter);
    link.addEventListener("mouseleave", onLeave);
    link.addEventListener("focus", onEnter);
    link.addEventListener("blur", onLeave);
  });

  window.addEventListener("resize", () => {
    items.forEach((item) => {
      const link = item.querySelector(".flowing-menu__link");
      const inner = item.querySelector("[data-marquee-inner]");
      if (!link || !inner) return;
      buildMarquee(
        inner,
        link.dataset.text || link.textContent.trim(),
        link.dataset.image || ""
      );
    });
  });
})();
