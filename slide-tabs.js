(function () {
  "use strict";

  var HASH_TO_INDEX = {
    requests: 0,
    results: 1,
    process: 2,
    about: 3,
    "why-clothes": 4,
    formats: 5,
    contact: 6,
  };

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getIndexFromHash() {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (!id) return 0;
    if (id in HASH_TO_INDEX) return HASH_TO_INDEX[id];
    return 0;
  }

  function initSlideTabs(grid) {
    var slide = grid.querySelector(".section-nav__slide");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".section-nav__card"));
    if (!slide || !cards.length) return;

    var selected = getIndexFromHash();
    var useGsap = typeof gsap !== "undefined" && !prefersReducedMotion();

    if (useGsap) {
      grid.classList.add("section-nav__grid--gsap");
    }

    function positionFor(card) {
      var gridRect = grid.getBoundingClientRect();
      var rect = card.getBoundingClientRect();
      return {
        left: rect.left - gridRect.left,
        top: rect.top - gridRect.top,
        width: rect.width,
        height: rect.height,
        opacity: 1,
      };
    }

    function moveSlide(card, immediate) {
      if (!card) return;
      var pos = positionFor(card);

      if (useGsap) {
        gsap.to(slide, {
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height,
          opacity: pos.opacity,
          duration: immediate ? 0 : 0.35,
          ease: "power3.out",
        });
        return;
      }

      slide.style.left = pos.left + "px";
      slide.style.top = pos.top + "px";
      slide.style.width = pos.width + "px";
      slide.style.height = pos.height + "px";
      slide.style.opacity = String(pos.opacity);
    }

    function setSelected(index, immediate) {
      selected = Math.max(0, Math.min(index, cards.length - 1));
      cards.forEach(function (card, i) {
        card.classList.toggle("section-nav__card--selected", i === selected);
      });
      moveSlide(cards[selected], immediate);
    }

    cards.forEach(function (card, index) {
      card.addEventListener("mouseenter", function () {
        moveSlide(card, false);
      });

      card.addEventListener("focus", function () {
        moveSlide(card, false);
      });

      card.addEventListener("click", function () {
        selected = index;
        cards.forEach(function (c, i) {
          c.classList.toggle("section-nav__card--selected", i === selected);
        });
      });
    });

    grid.addEventListener("mouseleave", function () {
      moveSlide(cards[selected], false);
    });

    window.addEventListener("hashchange", function () {
      setSelected(getIndexFromHash(), false);
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        moveSlide(cards[selected], true);
      }, 80);
    });

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        moveSlide(cards[selected], true);
      });
      ro.observe(grid);
      cards.forEach(function (card) {
        ro.observe(card);
      });
    }

    requestAnimationFrame(function () {
      setSelected(selected, true);
    });
  }

  function boot() {
    var grid = document.querySelector("[data-section-slide-tabs]");
    if (grid) initSlideTabs(grid);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
