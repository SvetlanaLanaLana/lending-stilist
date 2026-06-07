(function () {
  const config = window.FORM_CONFIG || {};
  const FORM_EMAIL = config.recipientEmail || "svpodols@mail.ru";
  const WEB3FORMS_KEY = (config.web3formsAccessKey || "").trim();
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/" + encodeURIComponent(FORM_EMAIL);
  const FORM_ACTION = "https://formsubmit.co/" + encodeURIComponent(FORM_EMAIL);
  const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

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
  let submitFrame = null;

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

  const buildPayload = (formData) => ({
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    purpose: String(formData.get("purpose") || "").trim(),
    consent: String(formData.get("consent") || ""),
    _subject: "Новая заявка с сайта — консультация",
    _template: "table",
    _captcha: "false",
    _replyto: String(formData.get("email") || "").trim(),
  });

  const showSuccess = () => {
    form.reset();
    setMessage(successEl, "Спасибо! Заявка отправлена. Скоро свяжусь с вами.");
    submitBtn.textContent = "Отправлено";
  };

  const submitViaWeb3Forms = async (payload) => {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: "Новая заявка с сайта — консультация",
        from_name: payload.name,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        purpose: payload.purpose,
        message: payload.purpose,
        consent: payload.consent,
      }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      /* ignore */
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Не удалось отправить заявку.");
    }

    return data;
  };

  const submitViaJson = async (payload) => {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      /* ignore */
    }

    if (!response.ok) {
      throw new Error(data.message || "Не удалось отправить заявку.");
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

  const sendApplication = async (payload) => {
    if (WEB3FORMS_KEY) {
      await submitViaWeb3Forms(payload);
      return;
    }

    try {
      await submitViaJson(payload);
    } catch (jsonErr) {
      try {
        await submitViaIframe();
      } catch (iframeErr) {
        throw jsonErr;
      }
    }
  };

  const openModal = (options = {}) => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("booking-open");

    const purposeField = form.querySelector("#booking-purpose");
    if (purposeField) {
      purposeField.value = options.service
        ? "Запись на консультацию: " + options.service
        : "";
    }

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
      const service = el.getAttribute("data-booking-service") || "";
      openModal(service ? { service } : {});
    });
  });

  document.addEventListener("booking:open", (e) => {
    openModal({ service: e.detail?.service || "" });
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

    const payload = buildPayload(new FormData(form));

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    try {
      await sendApplication(payload);
      showSuccess();
    } catch (err) {
      const needsKey = !WEB3FORMS_KEY;
      const isNetwork =
        err.message === "Failed to fetch" || err.name === "TypeError";

      let message =
        err.message && err.message !== "Failed to fetch"
          ? err.message
          : "Не удалось отправить заявку.";

      if (isNetwork && needsKey) {
        message =
          "Сервис отправки недоступен. Добавьте ключ Web3Forms в form-config.js (инструкция в файле) или напишите на " +
          FORM_EMAIL;
      } else if (isNetwork) {
        message = "Проверьте интернет и попробуйте снова или напишите на " + FORM_EMAIL;
      } else if (needsKey) {
        message += " Напишите на " + FORM_EMAIL + " или настройте form-config.js.";
      }

      setMessage(errorEl, message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить заявку";
    }
  });
})();
