(function () {
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/svpodols@mail.ru";
  const modal = document.getElementById("booking-modal");
  const form = document.getElementById("booking-form");
  if (!modal || !form) return;

  const errorEl = document.getElementById("booking-form-error");
  const successEl = document.getElementById("booking-form-success");
  const submitBtn = document.getElementById("booking-submit");
  const consent = document.getElementById("booking-consent");
  const openers = document.querySelectorAll("[data-booking-open]");
  const closers = modal.querySelectorAll("[data-booking-close]");

  let lastFocus = null;

  const setMessage = (el, text) => {
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  };

  const resetFormState = () => {
    setMessage(errorEl, "");
    setMessage(successEl, "");
    submitBtn.disabled = false;
    submitBtn.textContent = "Отправить заявку";
  };

  const openModal = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("booking-open");

    const header = document.querySelector("[data-site-header]");
    if (header?.classList.contains("site-header--open")) {
      header.classList.remove("site-header--open");
      document.body.classList.remove("nav-open");
      const toggle = header.querySelector("[data-nav-toggle]");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    const nameInput = form.querySelector("#booking-name");
    if (nameInput) nameInput.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("booking-open");
    resetFormState();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  openers.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closers.forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal.querySelector(".booking-modal__backdrop")) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage(errorEl, "");
    setMessage(successEl, "");

    if (!consent?.checked) {
      setMessage(errorEl, "Нужно дать согласие на обработку персональных данных.");
      consent?.focus();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    formData.append("_subject", "Новая заявка с сайта — консультация");
    formData.append("_template", "table");
    formData.append("_captcha", "false");

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Не удалось отправить заявку. Попробуйте позже.");
      }

      form.reset();
      setMessage(successEl, "Спасибо! Заявка отправлена. Скоро свяжусь с вами.");
      submitBtn.textContent = "Отправлено";
    } catch (err) {
      setMessage(errorEl, err.message || "Ошибка отправки. Проверьте интернет и попробуйте снова.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
})();
