(function () {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const toggle = header.querySelector("[data-nav-toggle]");
  const panel = header.querySelector("[data-nav-panel]");
  const links = panel ? panel.querySelectorAll("a") : [];

  const setOpen = (open) => {
    header.classList.toggle("site-header--open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  };

  const onScroll = () => {
    header.classList.toggle("site-header--scrolled", window.scrollY > 24);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      setOpen(!header.classList.contains("site-header--open"));
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }
})();
