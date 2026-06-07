(function () {
  const SERVICES = {
    colortype: {
      title: "Определение цветотипа по природным данным",
      description:
        "Разбираем ваши природные данные — оттенок кожи, цвет глаз и волос. Определяем цветотип и подбираем палитру, которая освежает лицо и делает образ гармоничным. Вы узнаете, какие цвета усиливают внешность, а какие лучше не использовать.",
      price: "3 тыс. руб.",
    },
    face: {
      title: "Определение типа лица",
      description:
        "Определяем форму лица и подбираем решения, которые её украшают: вырезы, воротники, очки, причёски и украшения. Объясняю простым языком, что подчёркивает черты лица и помогает выглядеть собраннее.",
      price: "3 тыс. руб.",
    },
    figure: {
      title: "Анализ фигуры",
      description:
        "Анализируем пропорции плеч, талии и бёдер, определяем тип фигуры и зоны, которые стоит смягчить или подчеркнуть. Вы получаете понятные рекомендации по силуэтам, длинам и посадке одежды — без сложных правил.",
      price: "3 тыс. руб.",
    },
    psychotype: {
      title: "Определение психотипа",
      description:
        "Определяем ваш стилевой психотип — какой образ вам близок по характеру и образу жизни. Это помогает выбирать одежду, в которой комфортно быть собой, а не следовать чужим трендам.",
      price: "3 тыс. руб.",
    },
    wardrobe: {
      title: "Рекомендации по составлению базового гардероба",
      description:
        "Собираем основу гардероба под ваш образ жизни, цветотип и тип фигуры. Определяем ключевые вещи, которые сочетаются между собой, и составляем понятный план покупок без лишних трат.",
      price: "3 тыс. руб.",
    },
  };

  const modal = document.getElementById("service-modal");
  if (!modal) return;

  const titleEl = document.getElementById("service-modal-title");
  const descEl = document.getElementById("service-modal-desc");
  const priceEl = document.getElementById("service-modal-price");
  const bookingBtn = modal.querySelector("[data-service-booking]");
  const triggers = document.querySelectorAll("[data-service]");
  const closers = modal.querySelectorAll("[data-service-close]");

  let lastFocus = null;
  let currentService = null;

  const openModal = (id) => {
    const service = SERVICES[id];
    if (!service) return;

    currentService = id;
    lastFocus = document.activeElement;

    if (titleEl) titleEl.textContent = service.title;
    if (descEl) descEl.textContent = service.description;
    if (priceEl) priceEl.textContent = service.price;
    if (bookingBtn) bookingBtn.setAttribute("data-booking-service", service.title);

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("service-open");

    const closeBtn = modal.querySelector(".service-modal__close");
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("service-open");
    currentService = null;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  triggers.forEach((el) => {
    el.addEventListener("click", () => openModal(el.getAttribute("data-service")));
  });

  closers.forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
  });

  if (bookingBtn) {
    bookingBtn.addEventListener("click", () => {
      const serviceTitle = bookingBtn.getAttribute("data-booking-service") || "";
      closeModal();
      document.dispatchEvent(
        new CustomEvent("booking:open", { detail: { service: serviceTitle } })
      );
    });
  }
})();
