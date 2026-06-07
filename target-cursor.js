(function () {
  "use strict";

  var AUTO_TARGETS =
    ".btn, .site-header__nav a, .site-header__brand, .site-header__toggle, .card, .for-you-card, .color-card, .quiz-teaser__btn, .page-back a, .booking-modal__close";

  function isMobile() {
    if (typeof window === "undefined") return true;
    var hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    var small = window.innerWidth <= 768;
    var ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
    var mobileUa = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    return (hasTouch && small) || mobileUa;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function tagInteractiveElements() {
    document.querySelectorAll(AUTO_TARGETS).forEach(function (el) {
      el.classList.add("cursor-target");
    });
  }

  function createCursorDOM() {
    var wrapper = document.createElement("div");
    wrapper.className = "target-cursor-wrapper";
    wrapper.setAttribute("aria-hidden", "true");

    var dot = document.createElement("div");
    dot.className = "target-cursor-dot";
    wrapper.appendChild(dot);

    ["corner-tl", "corner-tr", "corner-br", "corner-bl"].forEach(function (cls) {
      var corner = document.createElement("div");
      corner.className = "target-cursor-corner " + cls;
      wrapper.appendChild(corner);
    });

    document.body.appendChild(wrapper);
    return wrapper;
  }

  function initTargetCursor(options) {
    options = options || {};
    var targetSelector = options.targetSelector || ".cursor-target";
    var spinDuration = options.spinDuration != null ? options.spinDuration : 2;
    var hideDefaultCursor = options.hideDefaultCursor !== false;
    var hoverDuration = options.hoverDuration != null ? options.hoverDuration : 0.2;
    var parallaxOn = options.parallaxOn !== false;

    if (typeof gsap === "undefined") {
      console.warn("target-cursor: GSAP не загружен");
      return null;
    }

    if (isMobile() || prefersReducedMotion()) {
      return null;
    }

    tagInteractiveElements();

    var constants = { borderWidth: 3, cornerSize: 12 };
    var cursor = createCursorDOM();
    var dot = cursor.querySelector(".target-cursor-dot");
    var corners = cursor.querySelectorAll(".target-cursor-corner");

    var spinTl = null;
    var targetCornerPositions = null;
    var activeStrength = { current: 0 };
    var activeTarget = null;
    var currentLeaveHandler = null;
    var resumeTimeout = null;

    if (hideDefaultCursor) {
      document.documentElement.classList.add("has-target-cursor");
    }

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    function moveCursor(x, y) {
      gsap.to(cursor, { x: x, y: y, duration: 0.1, ease: "power3.out" });
    }

    function createSpinTimeline() {
      if (spinTl) spinTl.kill();
      spinTl = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
    }

    createSpinTimeline();

    function tickerFn() {
      if (!targetCornerPositions || !cursor || !corners.length) return;

      var strength = activeStrength.current;
      if (strength === 0) return;

      var cursorX = gsap.getProperty(cursor, "x");
      var cursorY = gsap.getProperty(cursor, "y");

      corners.forEach(function (corner, i) {
        var currentX = gsap.getProperty(corner, "x");
        var currentY = gsap.getProperty(corner, "y");
        var targetX = targetCornerPositions[i].x - cursorX;
        var targetY = targetCornerPositions[i].y - cursorY;
        var finalX = currentX + (targetX - currentX) * strength;
        var finalY = currentY + (targetY - currentY) * strength;
        var duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? "none" : "power1.out",
          overwrite: "auto",
        });
      });
    }

    function cleanupTarget(target) {
      if (currentLeaveHandler) {
        target.removeEventListener("mouseleave", currentLeaveHandler);
      }
      currentLeaveHandler = null;
    }

    function moveHandler(e) {
      moveCursor(e.clientX, e.clientY);
    }

    function scrollHandler() {
      if (!activeTarget || !cursor) return;
      var mouseX = gsap.getProperty(cursor, "x");
      var mouseY = gsap.getProperty(cursor, "y");
      var under = document.elementFromPoint(mouseX, mouseY);
      var stillOver =
        under &&
        (under === activeTarget || under.closest(targetSelector) === activeTarget);
      if (!stillOver && currentLeaveHandler) {
        currentLeaveHandler();
      }
    }

    function mouseDownHandler() {
      if (!dot) return;
      gsap.to(dot, { scale: 0.7, duration: 0.3 });
      gsap.to(cursor, { scale: 0.9, duration: 0.2 });
    }

    function mouseUpHandler() {
      if (!dot) return;
      gsap.to(dot, { scale: 1, duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    }

    function enterHandler(e) {
      var directTarget = e.target;
      var allTargets = [];
      var current = directTarget;

      while (current && current !== document.body) {
        if (current.matches && current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }

      var target = allTargets[0] || null;
      if (!target || !cursor || !corners.length) return;
      if (activeTarget === target) return;

      if (activeTarget) cleanupTarget(activeTarget);
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      corners.forEach(function (corner) {
        gsap.killTweensOf(corner);
      });

      gsap.killTweensOf(cursor, "rotation");
      if (spinTl) spinTl.pause();
      gsap.set(cursor, { rotation: 0 });

      var rect = target.getBoundingClientRect();
      var borderWidth = constants.borderWidth;
      var cornerSize = constants.cornerSize;
      var cursorX = gsap.getProperty(cursor, "x");
      var cursorY = gsap.getProperty(cursor, "y");

      targetCornerPositions = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        {
          x: rect.right + borderWidth - cornerSize,
          y: rect.bottom + borderWidth - cornerSize,
        },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
      ];

      gsap.ticker.add(tickerFn);

      gsap.to(activeStrength, {
        current: 1,
        duration: hoverDuration,
        ease: "power2.out",
      });

      corners.forEach(function (corner, i) {
        gsap.to(corner, {
          x: targetCornerPositions[i].x - cursorX,
          y: targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: "power2.out",
        });
      });

      function leaveHandler() {
        gsap.ticker.remove(tickerFn);
        targetCornerPositions = null;
        gsap.set(activeStrength, { current: 0, overwrite: true });
        activeTarget = null;

        var cornerSizeLeave = constants.cornerSize;
        var positions = [
          { x: -cornerSizeLeave * 1.5, y: -cornerSizeLeave * 1.5 },
          { x: cornerSizeLeave * 0.5, y: -cornerSizeLeave * 1.5 },
          { x: cornerSizeLeave * 0.5, y: cornerSizeLeave * 0.5 },
          { x: -cornerSizeLeave * 1.5, y: cornerSizeLeave * 0.5 },
        ];
        var tl = gsap.timeline();
        corners.forEach(function (corner, index) {
          gsap.killTweensOf(corner);
          tl.to(
            corner,
            {
              x: positions[index].x,
              y: positions[index].y,
              duration: 0.3,
              ease: "power3.out",
            },
            0
          );
        });

        resumeTimeout = setTimeout(function () {
          if (!activeTarget && cursor) {
            var currentRotation = gsap.getProperty(cursor, "rotation");
            var normalizedRotation = currentRotation % 360;
            if (spinTl) spinTl.kill();
            spinTl = gsap
              .timeline({ repeat: -1 })
              .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
            gsap.to(cursor, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: "none",
              onComplete: function () {
                if (spinTl) spinTl.restart();
              },
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      }

      currentLeaveHandler = leaveHandler;
      target.addEventListener("mouseleave", leaveHandler);
    }

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseover", enterHandler, { passive: true });
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    return {
      destroy: function () {
        gsap.ticker.remove(tickerFn);
        window.removeEventListener("mousemove", moveHandler);
        window.removeEventListener("mouseover", enterHandler);
        window.removeEventListener("scroll", scrollHandler);
        window.removeEventListener("mousedown", mouseDownHandler);
        window.removeEventListener("mouseup", mouseUpHandler);
        if (activeTarget) cleanupTarget(activeTarget);
        if (spinTl) spinTl.kill();
        document.documentElement.classList.remove("has-target-cursor");
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
      },
    };
  }

  function boot() {
    if (typeof gsap === "undefined") return;
    initTargetCursor({
      targetSelector: ".cursor-target",
      spinDuration: 2,
      hideDefaultCursor: true,
      hoverDuration: 0.2,
      parallaxOn: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
