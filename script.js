/**
 * FC Game Javascript Logic
 * ----------------------------------------------------
 * Organized structure for better maintainability.
 */

const body = document.body;
      const loader = document.getElementById("fcLoader");
      const loaderKickerText = document.getElementById("fcLoaderKickerText");
      const loaderAnimation = document.getElementById("fcLoaderAnimation");
      const loaderBar = document.getElementById("fcLoaderBar");
      const loaderProgress = document.getElementById("fcLoaderProgress");
      const loaderPercentage = document.getElementById("fcLoaderPercentage");
      const loaderStatus = document.getElementById("fcLoaderStatus");
      const themeToggle = document.getElementById("themeToggle");
      const themeToggleLabel = document.getElementById("themeToggleLabel");
      const hero = document.querySelector(".hero");
      const heroMedia = hero?.querySelector(".hero-media");
      const modelSection = document.querySelector(".model-section");
      const modelStages = Array.from(document.querySelectorAll(".model-stage"));
      const modelSwitches = Array.from(
        document.querySelectorAll("[data-model-slide]"),
      );
      const modelPrevButton = document.querySelector("[data-model-prev]");
      const modelNextButton = document.querySelector("[data-model-next]");
      const storageKey = "fcg-theme";
      const dragEnabled = window.matchMedia(
        "(hover: none) and (pointer: coarse)",
      );
      const gridHoverEnabled = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      );
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      const loaderStepDurationMs = prefersReducedMotion.matches ? 24 : 45;
      const loaderRevealDelayMs = prefersReducedMotion.matches ? 0 : 140;
      const loaderWarmupTimeoutMs = prefersReducedMotion.matches ? 0 : 1200;
      const loaderKickerValue = "Insert Coin";
      const loaderKickerTypeDelayMs = prefersReducedMotion.matches ? 0 : 90;
      const loaderKickerHoldDelayMs = prefersReducedMotion.matches ? 0 : 820;
      const loaderKickerDeleteDelayMs = prefersReducedMotion.matches ? 0 : 42;
      let loaderAnimationInstance = null;
      const fontsReadyPromise =
        document.fonts?.ready?.catch(() => undefined) || Promise.resolve();

      if (window.lottie) {
        window.lottie.setQuality("medium");
      }

      if (loaderAnimation && window.lottie) {
        loaderAnimationInstance = window.lottie.loadAnimation({
          container: loaderAnimation,
          renderer: "canvas",
          loop: true,
          autoplay: false,
          path: "game-lucky.json",
          rendererSettings: {
            clearCanvas: true,
            progressiveLoad: true,
            preserveAspectRatio: "xMidYMid meet",
          },
        });

        loaderAnimationInstance.setSubframe(false);
      }
      const loaderMessages = [
        {
          until: 18,
          label: "Menyalakan mesin...",
        },
        {
          until: 42,
          label: "Mengisi token arcade...",
        },
        {
          until: 68,
          label: "Sinkronisasi permainan...",
        },
        {
          until: 92,
          label: "Merapikan arena retro...",
        },
        {
          until: 100,
          label: "Arcade siap dimainkan!",
        },
      ];
      const dragState = {
        active: false,
        pointerId: null,
        startX: 0,
        progress: 0,
        moved: false,
        ignoreClick: false,
      };
      const gridHoverState = {
        frameId: null,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5,
        trailX: window.innerWidth * 0.5,
        trailY: window.innerHeight * 0.5,
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.5,
        opacity: 0,
        targetOpacity: 0,
      };
      const heroParallaxState = {
        frameId: null,
      };
      const loaderState = {
        value: 0,
        frameId: null,
        completeFrameId: null,
        kickerFrameId: null,
        lastLabel: "",
        lastRoundedProgress: -1,
        pageReady: document.readyState === "complete",
        progressComplete: false,
        visible: false,
        revealing: false,
        startTime: window.performance.now(),
        done: false,
        hidden: false,
      };
      let activeModelSlide = 0;

      function stopLoaderKickerLoop() {
        if (loaderState.kickerFrameId !== null) {
          window.clearTimeout(loaderState.kickerFrameId);
          loaderState.kickerFrameId = null;
        }
      }

      function startLoaderKickerLoop() {
        if (!loaderKickerText) {
          return;
        }

        stopLoaderKickerLoop();

        let characterCount = 0;
        let isDeleting = false;

        const step = () => {
          if (!loaderKickerText || loaderState.hidden) {
            stopLoaderKickerLoop();
            return;
          }

          if (!isDeleting) {
            characterCount = Math.min(
              loaderKickerValue.length,
              characterCount + 1,
            );
            loaderKickerText.textContent = loaderKickerValue.slice(
              0,
              characterCount,
            );

            if (characterCount >= loaderKickerValue.length) {
              isDeleting = true;
              loaderState.kickerFrameId = window.setTimeout(
                step,
                loaderKickerHoldDelayMs,
              );
              return;
            }

            loaderState.kickerFrameId = window.setTimeout(
              step,
              loaderKickerTypeDelayMs,
            );
            return;
          }

          characterCount = Math.max(1, characterCount - 1);
          loaderKickerText.textContent = loaderKickerValue.slice(
            0,
            characterCount,
          );

          if (characterCount <= 1) {
            isDeleting = false;
            loaderState.kickerFrameId = window.setTimeout(
              step,
              loaderKickerTypeDelayMs,
            );
            return;
          }

          loaderState.kickerFrameId = window.setTimeout(
            step,
            loaderKickerDeleteDelayMs,
          );
        };

        loaderKickerText.textContent = "";
        loaderState.kickerFrameId = window.setTimeout(
          step,
          loaderKickerTypeDelayMs,
        );
      }

      function waitForPaints(count = 2) {
        return new Promise((resolve) => {
          function step() {
            if (count <= 0) {
              resolve();
              return;
            }

            count -= 1;
            window.requestAnimationFrame(step);
          }

          step();
        });
      }

      function waitForLoaderAnimationWarmup() {
        if (!loaderAnimationInstance) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          let settled = false;
          const settle = () => {
            if (settled) {
              return;
            }

            settled = true;
            cleanup();
            loaderAnimationInstance.goToAndStop(0, true);
            resolve();
          };
          const eventNames = [
            "DOMLoaded",
            "data_ready",
            "loaded_images",
            "data_failed",
          ];
          const cleanup = () => {
            eventNames.forEach((eventName) => {
              loaderAnimationInstance.removeEventListener(eventName, settle);
            });
          };

          eventNames.forEach((eventName) => {
            loaderAnimationInstance.addEventListener(eventName, settle);
          });

          window.setTimeout(settle, loaderWarmupTimeoutMs);
        });
      }

      async function revealLoaderWhenStable() {
        if (
          !loader ||
          loaderState.hidden ||
          loaderState.visible ||
          loaderState.revealing
        ) {
          return;
        }

        loaderState.revealing = true;

        await Promise.allSettled([
          fontsReadyPromise,
          waitForLoaderAnimationWarmup(),
        ]);
        await waitForPaints(2);

        if (loaderRevealDelayMs > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, loaderRevealDelayMs);
          });
        }

        if (!loader || loaderState.hidden || loaderState.visible) {
          loaderState.revealing = false;
          return;
        }

        body.classList.remove("is-preparing");
        body.classList.add("is-loading");
        loader.classList.remove("is-hidden");
        loader.classList.remove("is-panel-hidden");
        loader.removeAttribute("aria-hidden");
        loaderState.visible = true;
        loaderState.revealing = false;

        setLoaderProgressValue(0);

        if (loaderAnimationInstance) {
          loaderAnimationInstance.goToAndPlay(0, true);
        }

        startLoaderKickerLoop();
        queueLoaderFrame();
      }

      function getLoaderLabel(progress) {
        return (
          loaderMessages.find((message) => progress <= message.until)?.label ||
          loaderMessages[loaderMessages.length - 1].label
        );
      }

      function setLoaderProgressValue(progress, isComplete = false) {
        if (!loader || !loaderBar || !loaderProgress || !loaderPercentage) {
          return;
        }

        const safeProgress = Math.min(100, Math.max(0, progress));
        loaderState.value = safeProgress;

        const roundedProgress = Math.round(safeProgress);
        const nextLabel = isComplete
          ? "Arcade siap dimainkan!"
          : getLoaderLabel(roundedProgress);

        loaderBar.style.transform = `scaleX(${(safeProgress / 100).toFixed(4)})`;

        if (loaderState.lastRoundedProgress !== roundedProgress) {
          loaderState.lastRoundedProgress = roundedProgress;
          loaderProgress.setAttribute(
            "aria-valuenow",
            roundedProgress.toString(),
          );
          loaderPercentage.textContent = `${roundedProgress}%`;
        }

        if (loaderStatus && loaderState.lastLabel !== nextLabel) {
          loaderState.lastLabel = nextLabel;
          loaderStatus.textContent = nextLabel;
        }
      }

      function maybeFinishLoader() {
        if (
          !loader ||
          loaderState.done ||
          loaderState.hidden ||
          !loaderState.pageReady ||
          !loaderState.progressComplete
        ) {
          return;
        }

        finishLoader();
      }

      function markLoaderReady() {
        loaderState.pageReady = true;
        maybeFinishLoader();
      }

      function queueLoaderFrame() {
        if (
          !loader ||
          loaderState.done ||
          loaderState.hidden ||
          loaderState.frameId !== null
        ) {
          return;
        }

        loaderBar.style.transitionDuration = `${loaderStepDurationMs}ms`;
        loaderBar.style.transitionTimingFunction = "linear";
        loaderState.frameId = window.setInterval(
          stepLoaderProgress,
          loaderStepDurationMs,
        );
      }

      function stepLoaderProgress() {
        if (!loader || loaderState.done || loaderState.hidden) {
          return;
        }

        const nextProgress = Math.min(100, loaderState.value + 1);
        setLoaderProgressValue(nextProgress, nextProgress >= 100);

        if (nextProgress < 100) {
          return;
        }

        loaderState.progressComplete = true;

        if (loaderState.frameId !== null) {
          window.clearInterval(loaderState.frameId);
          loaderState.frameId = null;
        }

        maybeFinishLoader();
      }

      function hideLoader() {
        if (!loader || loaderState.hidden) {
          body.classList.remove("is-loading");
          return;
        }

        if (loaderState.frameId !== null) {
          window.clearInterval(loaderState.frameId);
          loaderState.frameId = null;
        }

        if (loaderState.completeFrameId !== null) {
          window.cancelAnimationFrame(loaderState.completeFrameId);
          loaderState.completeFrameId = null;
        }

        loaderState.hidden = true;
        loader.classList.add("is-hidden");
        loader.setAttribute("aria-hidden", "true");

        if (loaderAnimationInstance) {
          loaderAnimationInstance.destroy();
          loaderAnimationInstance = null;
        }

        stopLoaderKickerLoop();

        window.setTimeout(
          () => {
            loader.remove();
            body.classList.remove("is-preparing");
            body.classList.remove("is-loading");
          },
          prefersReducedMotion.matches ? 0 : 700,
        );
      }

      function finishLoader() {
        if (!loader || loaderState.done || loaderState.hidden) {
          hideLoader();
          return;
        }

        loaderState.done = true;

        if (loaderState.frameId !== null) {
          window.clearInterval(loaderState.frameId);
          loaderState.frameId = null;
        }
        setLoaderProgressValue(100, true);
        window.setTimeout(hideLoader, prefersReducedMotion.matches ? 0 : 240);
      }

      function getThemeProgress() {
        return body.classList.contains("theme-dark") ? 1 : 0;
      }

      function clampProgress(progress) {
        return Math.min(1, Math.max(0, progress));
      }

      function setToggleProgress(progress) {
        dragState.progress = clampProgress(progress);
        themeToggle.style.setProperty(
          "--toggle-progress",
          dragState.progress.toFixed(4),
        );
      }

      function clearToggleProgress() {
        themeToggle.style.removeProperty("--toggle-progress");
      }

      function renderGridHover() {
        body.style.setProperty("--grid-hover-x", `${gridHoverState.x}px`);
        body.style.setProperty("--grid-hover-y", `${gridHoverState.y}px`);
        body.style.setProperty("--grid-trail-x", `${gridHoverState.trailX}px`);
        body.style.setProperty("--grid-trail-y", `${gridHoverState.trailY}px`);
        body.style.setProperty(
          "--grid-hover-opacity",
          gridHoverState.opacity.toFixed(4),
        );
      }

      function stepGridHover() {
        gridHoverState.frameId = null;

        const positionEase = 0.065;
        const trailEase = 0.04;
        const opacityEase = 0.05;

        gridHoverState.x +=
          (gridHoverState.targetX - gridHoverState.x) * positionEase;
        gridHoverState.y +=
          (gridHoverState.targetY - gridHoverState.y) * positionEase;
        gridHoverState.trailX +=
          (gridHoverState.x - gridHoverState.trailX) * trailEase;
        gridHoverState.trailY +=
          (gridHoverState.y - gridHoverState.trailY) * trailEase;
        gridHoverState.opacity +=
          (gridHoverState.targetOpacity - gridHoverState.opacity) * opacityEase;

        renderGridHover();

        const isStillMoving =
          Math.abs(gridHoverState.targetX - gridHoverState.x) > 0.4 ||
          Math.abs(gridHoverState.targetY - gridHoverState.y) > 0.4 ||
          Math.abs(gridHoverState.x - gridHoverState.trailX) > 0.4 ||
          Math.abs(gridHoverState.y - gridHoverState.trailY) > 0.4 ||
          Math.abs(gridHoverState.targetOpacity - gridHoverState.opacity) >
            0.01;

        if (isStillMoving) {
          queueGridHoverRender();
        }
      }

      function queueGridHoverRender() {
        if (gridHoverState.frameId !== null) {
          return;
        }

        gridHoverState.frameId = window.requestAnimationFrame(stepGridHover);
      }

      function showGridHover(x, y) {
        gridHoverState.targetX = x;
        gridHoverState.targetY = y;
        gridHoverState.targetOpacity = 1;
        queueGridHoverRender();
      }

      function hideGridHover() {
        gridHoverState.targetOpacity = 0;
        queueGridHoverRender();
      }

      function setModelSlide(index) {
        if (!modelSection || modelSwitches.length === 0) {
          return;
        }

        const totalSlides = modelSwitches.length;
        activeModelSlide = (index + totalSlides) % totalSlides;
        modelSection.style.setProperty(
          "--model-slider-index",
          activeModelSlide.toString(),
        );

        modelSwitches.forEach((button, buttonIndex) => {
          const isActive = buttonIndex === activeModelSlide;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      }

      function updateModelCursorReveal(event) {
        if (prefersReducedMotion.matches) {
          return;
        }

        const currentStage = event.currentTarget;
        if (!(currentStage instanceof HTMLElement)) {
          return;
        }

        const rect = currentStage.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        currentStage.style.setProperty("--model-reveal-x", `${offsetX}px`);
        currentStage.style.setProperty("--model-reveal-y", `${offsetY}px`);
        currentStage.style.setProperty("--model-reveal-opacity", "1");
      }

      function hideModelCursorReveal(event) {
        const currentStage = event.currentTarget;
        if (!(currentStage instanceof HTMLElement)) {
          return;
        }

        currentStage.style.setProperty("--model-reveal-opacity", "0");
      }

      function resetHeroParallax() {
        if (!hero || !heroMedia) {
          return;
        }

        hero.style.setProperty("--hero-parallax-wrap-shift", "0px");
        hero.style.setProperty("--hero-parallax-media-shift", "0px");
        hero.style.setProperty("--hero-parallax-opacity", "1");
      }

      function renderHeroParallax() {
        heroParallaxState.frameId = null;

        if (!hero || !heroMedia || prefersReducedMotion.matches) {
          resetHeroParallax();
          return;
        }

        const rect = hero.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const travelDistance = Math.max(rect.height + viewportHeight * 0.3, 1);
        const progress = clampProgress(-rect.top / travelDistance);
        const wrapShift = Math.round(
          progress * Math.min(viewportHeight * 0.18, 120),
        );
        const mediaShift = Math.round(
          progress * Math.min(viewportHeight * 0.62, 360),
        );
        const opacity = clampProgress(1 - progress * 0.58);

        hero.style.setProperty("--hero-parallax-wrap-shift", `${wrapShift}px`);
        hero.style.setProperty(
          "--hero-parallax-media-shift",
          `${mediaShift}px`,
        );
        hero.style.setProperty("--hero-parallax-opacity", opacity.toFixed(4));
      }

      function queueHeroParallaxRender() {
        if (!hero || !heroMedia || heroParallaxState.frameId !== null) {
          return;
        }

        heroParallaxState.frameId =
          window.requestAnimationFrame(renderHeroParallax);
      }

      function handleHeroParallaxPreference() {
        if (prefersReducedMotion.matches) {
          resetHeroParallax();
          return;
        }

        queueHeroParallaxRender();
      }

      function getDragMetrics() {
        const knobSize = 36;
        const sideInset = 6;
        const travelDistance =
          themeToggle.clientWidth - knobSize - sideInset * 2;

        return {
          left: sideInset,
          travelDistance,
        };
      }

      function applyTheme(theme) {
        body.classList.remove("theme-dark", "theme-light");
        body.classList.add(theme);

        const nextLabel =
          theme === "theme-dark"
            ? "Switch ke Light Mode"
            : "Switch ke Night Mode";

        themeToggleLabel.textContent = nextLabel;
        themeToggle.title = nextLabel;
        themeToggle.setAttribute("aria-label", nextLabel);
        themeToggle.setAttribute(
          "aria-pressed",
          theme === "theme-light" ? "true" : "false",
        );

        if (!dragState.active) {
          clearToggleProgress();
        }
      }

      function saveTheme(theme) {
        try {
          localStorage.setItem(storageKey, theme);
        } catch (error) {
          /* Ignore storage failures on restricted contexts. */
        }
      }

      function commitTheme(theme) {
        applyTheme(theme);
        saveTheme(theme);
      }

      function finishDrag(shouldCommit) {
        const nextTheme =
          dragState.progress >= 0.5 ? "theme-dark" : "theme-light";

        if (shouldCommit) {
          commitTheme(nextTheme);
        } else {
          clearToggleProgress();
        }

        themeToggle.classList.remove("is-dragging");
        dragState.active = false;
        dragState.pointerId = null;
        dragState.startX = 0;
        dragState.moved = false;
      }

      function handlePointerMove(event) {
        if (!dragState.active || event.pointerId !== dragState.pointerId) {
          return;
        }

        const { left, travelDistance } = getDragMetrics();
        const knobSize = 36;
        const rect = themeToggle.getBoundingClientRect();
        const knobCenter = event.clientX - rect.left;
        const relativePosition =
          (knobCenter - left - knobSize / 2) / travelDistance;
        const nextProgress = clampProgress(relativePosition);

        if (Math.abs(event.clientX - dragState.startX) > 6) {
          dragState.moved = true;
        }

        setToggleProgress(nextProgress);
      }

      function handlePointerUp(event) {
        if (!dragState.active || event.pointerId !== dragState.pointerId) {
          return;
        }

        dragState.ignoreClick = dragState.moved;
        finishDrag(dragState.moved);
      }

      function handlePointerCancel(event) {
        if (!dragState.active || event.pointerId !== dragState.pointerId) {
          return;
        }

        finishDrag(false);
      }

      let savedTheme = null;

      try {
        savedTheme = localStorage.getItem(storageKey);
      } catch (error) {
        savedTheme = null;
      }

      const preferredTheme =
        savedTheme === "theme-dark" || savedTheme === "theme-light"
          ? savedTheme
          : "theme-dark";

      setLoaderProgressValue(0);
      revealLoaderWhenStable();

      if (document.readyState === "complete") {
        markLoaderReady();
      } else {
        window.addEventListener("load", markLoaderReady, { once: true });
      }

      window.setTimeout(() => {
        if (!loaderState.pageReady) {
          markLoaderReady();
        }
      }, 12000);

      applyTheme(preferredTheme);
      setModelSlide(0);
      handleHeroParallaxPreference();

      themeToggle.addEventListener("pointerdown", (event) => {
        if (!dragEnabled.matches) {
          return;
        }

        if (!event.isPrimary) {
          return;
        }

        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        dragState.active = true;
        dragState.pointerId = event.pointerId;
        dragState.startX = event.clientX;
        dragState.moved = false;
        dragState.progress = getThemeProgress();
        dragState.ignoreClick = false;

        themeToggle.classList.add("is-dragging");
        setToggleProgress(dragState.progress);
        themeToggle.setPointerCapture(event.pointerId);
      });

      themeToggle.addEventListener("pointermove", handlePointerMove);
      themeToggle.addEventListener("pointerup", handlePointerUp);
      themeToggle.addEventListener("pointercancel", handlePointerCancel);
      themeToggle.addEventListener("lostpointercapture", () => {
        if (dragState.active) {
          finishDrag(dragState.moved);
        }
      });

      themeToggle.addEventListener("click", () => {
        if (dragState.ignoreClick) {
          dragState.ignoreClick = false;
          return;
        }

        const nextTheme = body.classList.contains("theme-dark")
          ? "theme-light"
          : "theme-dark";

        commitTheme(nextTheme);
      });

      window.addEventListener("scroll", queueHeroParallaxRender, {
        passive: true,
      });
      window.addEventListener("resize", queueHeroParallaxRender);

      if (typeof prefersReducedMotion.addEventListener === "function") {
        prefersReducedMotion.addEventListener(
          "change",
          handleHeroParallaxPreference,
        );
      } else if (typeof prefersReducedMotion.addListener === "function") {
        prefersReducedMotion.addListener(handleHeroParallaxPreference);
      }

      modelSwitches.forEach((button) => {
        button.addEventListener("click", () => {
          const nextSlide = Number(button.dataset.modelSlide);
          if (Number.isNaN(nextSlide)) {
            return;
          }

          setModelSlide(nextSlide);
        });
      });

      if (modelPrevButton) {
        modelPrevButton.addEventListener("click", () => {
          setModelSlide(activeModelSlide - 1);
        });
      }

      if (modelNextButton) {
        modelNextButton.addEventListener("click", () => {
          setModelSlide(activeModelSlide + 1);
        });
      }

      modelStages.forEach((stage) => {
        stage.addEventListener("pointermove", updateModelCursorReveal, {
          passive: true,
        });
        stage.addEventListener("pointerleave", hideModelCursorReveal);
      });

      if (gridHoverEnabled.matches) {
        document.addEventListener(
          "pointermove",
          (event) => {
            if (event.pointerType !== "mouse") {
              return;
            }

            showGridHover(event.clientX, event.clientY);
          },
          { passive: true },
        );

        document.body.addEventListener("pointerleave", hideGridHover);
        window.addEventListener("blur", hideGridHover);
      } else {
        hideGridHover();
      }

      // --- SCROLL REVEAL ANIMATIONS ---
      function initScrollReveal() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return; // Do not apply reveal if user prefers reduced motion
        }

        const revealElements = document.querySelectorAll(
          '.card, .section-title, .section-description, .step-card, .reward-card, .promo-card, .location-card, .map-card, .testimonial-card, .gallery-card'
        );

        if ('IntersectionObserver' in window) {
          const revealObserver = new IntersectionObserver(
            (entries, observer) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('reveal-visible');
                  entry.target.classList.remove('reveal-hidden');
                  observer.unobserve(entry.target);
                }
              });
            },
            {
              root: null,
              rootMargin: '0px 0px -50px 0px',
              threshold: 0.05,
            }
          );

          revealElements.forEach((el, i) => {
            el.classList.add('reveal-hidden');
            // Stagger animation delays for elements in the same row/group implicitly
            el.style.transitionDelay = `${(i % 4) * 80}ms`;
            revealObserver.observe(el);
          });
        }
      }

      if (document.readyState === "complete" || document.readyState === "interactive") {
        initScrollReveal();
      } else {
        window.addEventListener("DOMContentLoaded", initScrollReveal);
      }