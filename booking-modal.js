(function () {
  const config = window.FORM_CONFIG || {};
  const FORM_EMAIL = config.recipientEmail || "svpodols@mail.ru";
  const TELEGRAM_TOKEN = (config.telegramBotToken || "").trim();
  const TELEGRAM_CHAT_ID = String(config.telegramChatId || "").trim();
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/" + encodeURIComponent(FORM_EMAIL);
  const FORM_ACTION = "https://formsubmit.co/" + encodeURIComponent(FORM_EMAIL);

  const modal = document.getElementById("booking-modal");
  const form = document.getElementById("booking-form");
  if (!modal || !form) return;

  const errorEl = document.getElementById("booking-form-error");
  const successEl = document.getElementById("booking-form-success");
  const submitBtn = document.getElementById("booking-submit");
  const consent = document.getElementById("booking-consent");
  const emailInput = form.querySelector("#booking-email");
  const phoneInput = form.querySelector("#booking-phone");
  const contactTypeInputs = form.querySelectorAll('input[name="contact_type"]');
  const contactFields = form.querySelectorAll("[data-contact-field]");
  const serviceInputs = form.querySelectorAll('input[name="service"]');
  const openers = document.querySelectorAll("[data-booking-open]");
  const closers = modal.querySelectorAll("[data-booking-close]");

  const SERVICE_LABELS = {
    colortype: "Определение цветотипа по природным данным — 3 тыс. руб.",
    face: "Определение типа лица — 3 тыс. руб.",
    figure: "Анализ фигуры — 3 тыс. руб.",
    psychotype: "Определение психотипа — 3 тыс. руб.",
    wardrobe: "Рекомендации по составлению базового гардероба — 3 тыс. руб.",
    package: "Полный пакет услуг — 12 тыс. руб.",
  };

  let lastFocus = null;
  let submitFrame = null;

  const getSelectedService = () => {
    const checked = form.querySelector('input[name="service"]:checked');
    if (!checked) return "";
    return SERVICE_LABELS[checked.value] || checked.value;
  };

  const setSelectedService = (serviceId) => {
    serviceInputs.forEach((input) => {
      input.checked = input.value === serviceId;
    });
  };

  const clearSelectedService = () => {
    serviceInputs.forEach((input) => {
      input.checked = false;
    });
  };

  const getContactType = () => {
    const checked = form.querySelector('input[name="contact_type"]:checked');
    return checked?.value === "phone" ? "phone" : "email";
  };

  const syncContactFields = () => {
    const type = getContactType();

    contactFields.forEach((field) => {
      const isActive = field.getAttribute("data-contact-field") === type;
      field.hidden = !isActive;
    });

    if (emailInput) {
      emailInput.required = type === "email";
      if (type !== "email") emailInput.value = "";
    }

    if (phoneInput) {
      phoneInput.required = type === "phone";
      if (type !== "phone") phoneInput.value = "";
    }
  };

  contactTypeInputs.forEach((input) => {
    input.addEventListener("change", syncContactFields);
  });

  syncContactFields();

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

  const buildPayload = (formData) => {
    const service = getSelectedService();
    const contactType = getContactType();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const contactValue = contactType === "phone" ? phone : email;
    const contactLabel = contactType === "phone" ? "Телефон" : "Почта";
    const purpose = String(formData.get("purpose") || "").trim();
    const purposeText = [
      "Услуга: " + service,
      "Связь: " + contactLabel + " — " + contactValue,
      purpose ? "Дополнительно: " + purpose : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      name: String(formData.get("name") || "").trim(),
      email: contactType === "email" ? email : "—",
      phone: contactType === "phone" ? phone : "—",
      contactType,
      contactLabel,
      contactValue,
      service,
      purpose: purposeText,
      consent: String(formData.get("consent") || ""),
      _subject: "Новая заявка с сайта — консультация",
      _template: "table",
      _captcha: "false",
      _replyto: contactType === "email" ? email : "",
    };
  };

  const showSuccess = () => {
    form.reset();
    syncContactFields();
    setMessage(successEl, "Спасибо! Заявка отправлена. Скоро свяжусь с вами.");
    submitBtn.textContent = "Отправлено";
  };

  const submitViaFormSubmit = async (payload) => {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        service: payload.service,
        message: payload.purpose,
        _subject: payload._subject,
        _template: payload._template,
        _captcha: payload._captcha,
        _replyto: payload._replyto,
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      /* ignore */
    }

    if (!response.ok) {
      throw new Error(data.message || "Не удалось отправить заявку на почту.");
    }

    return data;
  };

  const submitViaTelegram = async (payload) => {
    const text = [
      "Новая заявка с сайта",
      "",
      "Имя: " + payload.name,
      payload.contactLabel + ": " + payload.contactValue,
      "",
      payload.purpose,
    ].join("\n");

    const response = await fetch(
      "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
        }),
      }
    );

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      /* ignore */
    }

    if (!response.ok || !data.ok) {
      throw new Error("Не удалось отправить уведомление в Telegram.");
    }

    return data;
  };

  const ensureSubmitFrame = () => {
    if (submitFrame) return submitFrame;
    submitFrame = document.createElement("iframe");
    submitFrame.name = "booking-form-frame";
    submitFrame.id = "booking-form-frame";
    submitFrame.hidden = true;
    submitFrame.title = "Отправка заявки";
    document.body.appendChild(submitFrame);
    return submitFrame;
  };

  const submitViaIframe = () =>
    new Promise((resolve, reject) => {
      const frame = ensureSubmitFrame();
      let settled = false;
      let armed = false;

      const finish = (ok, message) => {
        if (settled) return;
        settled = true;
        frame.removeEventListener("load", onLoad);
        form.removeAttribute("target");
        window.clearTimeout(timer);
        if (ok) resolve();
        else reject(new Error(message));
      };

      const onLoad = () => {
        if (!armed) return;
        finish(true);
      };

      const timer = window.setTimeout(() => finish(true), 10000);

      frame.addEventListener("load", onLoad);

      const replyto = form.querySelector('input[name="_replyto"]');
      const email = form.querySelector("#booking-email");
      if (replyto && email) replyto.value = email.value.trim();

      form.action = FORM_ACTION;
      form.method = "POST";
      form.target = "booking-form-frame";
      armed = true;
      form.submit();
    });

  const hasTelegram = Boolean(TELEGRAM_TOKEN && TELEGRAM_CHAT_ID);

  const notifyTelegram = (payload) => {
    if (!hasTelegram) return Promise.resolve();
    return submitViaTelegram(payload).catch(() => {});
  };

  const sendApplication = async (payload) => {
    try {
      await submitViaFormSubmit(payload);
      await notifyTelegram(payload);
      return;
    } catch (formSubmitErr) {
      try {
        await submitViaIframe();
        await notifyTelegram(payload);
        return;
      } catch (_) {
        throw (
          formSubmitErr ||
          new Error(
            "Не удалось отправить заявку. Проверьте интернет или напишите на " + FORM_EMAIL
          )
        );
      }
    }
  };

  const openModal = (options = {}) => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("booking-open");

    const purposeField = form.querySelector("#booking-purpose");
    if (purposeField) purposeField.value = "";

    if (options.serviceId && SERVICE_LABELS[options.serviceId]) {
      setSelectedService(options.serviceId);
    } else {
      clearSelectedService();
    }

    const header = document.querySelector("[data-site-header]");
    if (header?.classList.contains("site-header--open")) {
      header.classList.remove("site-header--open");
      document.body.classList.remove("nav-open");
      const toggle = header.querySelector("[data-nav-toggle]");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    syncContactFields();

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
      const serviceId = el.getAttribute("data-booking-service-id") || "";
      openModal(serviceId ? { serviceId } : {});
    });
  });

  document.addEventListener("booking:open", (e) => {
    openModal({ serviceId: e.detail?.serviceId || "" });
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

    if (!getSelectedService()) {
      setMessage(errorEl, "Выберите услугу или полный пакет.");
      const firstService = form.querySelector('input[name="service"]');
      firstService?.focus();
      return;
    }

    syncContactFields();

    const contactType = getContactType();
    const contactValue =
      contactType === "phone"
        ? phoneInput?.value.trim()
        : emailInput?.value.trim();

    if (!contactValue) {
      setMessage(
        errorEl,
        contactType === "phone" ? "Укажите номер телефона." : "Укажите почту."
      );
      (contactType === "phone" ? phoneInput : emailInput)?.focus();
      return;
    }

    if (!consent?.checked) {
      setMessage(errorEl, "Нужно дать согласие на обработку персональных данных.");
      consent?.focus();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = buildPayload(new FormData(form));

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    try {
      await sendApplication(payload);
      showSuccess();
    } catch (err) {
      const isNetwork =
        err.message === "Failed to fetch" || err.name === "TypeError";

      let message =
        err.message && err.message !== "Failed to fetch"
          ? err.message
          : "Не удалось отправить заявку.";

      if (isNetwork) {
        message =
          "Проверьте интернет и попробуйте снова или напишите на " + FORM_EMAIL;
      }

      setMessage(errorEl, message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
})();

