(function () {
  const root = document.querySelector("[data-testimonials]");
  if (!root) return;

  const track = root.querySelector("[data-testimonials-track]");
  const prevBtn = root.querySelector("[data-testimonials-prev]");
  const nextBtn = root.querySelector("[data-testimonials-next]");
  const modal = document.querySelector("[data-testimonial-modal]");
  const modalRole = document.querySelector("[data-testimonial-modal-role]");
  const modalName = document.querySelector("[data-testimonial-modal-name]");
  const modalText = document.querySelector("[data-testimonial-modal-text]");
  const closeEls = document.querySelectorAll("[data-testimonial-close]");
  const cards = root.querySelectorAll("[data-testimonial-card]");

  if (!track || !prevBtn || !nextBtn || !modal) return;

  let scrollY = 0;

  const scrollStep = () => {
    const card = track.querySelector(".testimonial-card");
    if (!card) return 300;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    return card.offsetWidth + gap;
  };

  const updateNav = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft >= maxScroll;
  };

  prevBtn.addEventListener("click", () => {
    track.scrollBy({ left: -scrollStep(), behavior: "smooth" });
  });

  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: scrollStep(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateNav, { passive: true });
  window.addEventListener("resize", updateNav);
  updateNav();

  const lockScroll = () => {
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
  };

  const openModal = (card) => {
    const name = card.querySelector(".testimonial-card__name")?.textContent?.trim() || "";
    const role = card.querySelector(".testimonial-card__role")?.textContent?.trim() || "";
    const quote = card.querySelector(".testimonial-card__quote")?.textContent?.trim() || "";

    modalRole.textContent = role;
    modalName.textContent = name;
    modalText.textContent = quote;
    modal.hidden = false;
    lockScroll();
    modal.querySelector(".testimonial-modal__close")?.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    unlockScroll();
  };

  cards.forEach((card) => {
    const trigger = card.querySelector(".testimonial-card__trigger");
    trigger?.addEventListener("click", () => openModal(card));
  });

  closeEls.forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
})();
