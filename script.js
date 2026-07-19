/* Portfolio interaction layer. Contact details and Formspree endpoint live in index.html. */
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const cursor = document.querySelector(".cursor");
  const intro = document.querySelector(".intro");
  const reveals = document.querySelectorAll(".reveal");
  const header = document.querySelector(".site-header");

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    document.body.classList.toggle("show-mobile-cta", window.scrollY > window.innerHeight * .55);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  document.querySelectorAll(".intro-video__media").forEach((video) => {
    const frame = video.closest(".intro-video__frame");
    const placeholder = frame ? frame.querySelector(".intro-video__placeholder") : null;
    const hasSource = Boolean(video.querySelector("source[src]")) || Boolean(video.getAttribute("src"));

    if (hasSource && frame) frame.classList.add("has-video");
    if (placeholder) {
      placeholder.addEventListener("click", () => {
        if (!frame || !frame.classList.contains("has-video")) return;
        video.play();
      });
    }
  });

  function showPageWithoutGsap() {
    reveals.forEach((element) => {
      element.style.opacity = "1";
      element.style.transform = "none";
    });
    if (intro) intro.style.display = "none";
  }

  if (!window.gsap || reduceMotion) {
    showPageWithoutGsap();
  } else {
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const timeline = gsap.timeline({ defaults: { ease: "power3.inOut" } });
    gsap.set(".hero__title", { y: 28, opacity: 0 });
    timeline
      .from(".intro span", { yPercent: 105, duration: 0.45, delay: 0.1 })
      .to(".intro", { yPercent: -100, duration: 0.65, delay: 0.14 })
      .from(".site-header", { y: -22, opacity: 0, duration: 0.55 }, "<.18")
      .to(".hero .reveal", { y: 0, opacity: 1, duration: 0.75, stagger: 0.09 }, "<.1")
      .to(".hero__title", { y: 0, opacity: 1, duration: 0.82 }, "<.06");

    reveals.forEach((element) => {
      if (element.closest(".hero")) return;
      gsap.to(element, {
        y: 0,
        opacity: 1,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      });
    });

    gsap.utils.toArray(".section-heading h2, .proof blockquote, .contact h2").forEach((heading) => {
      gsap.from(heading, {
        y: 24,
        opacity: 0,
        duration: 0.78,
        ease: "power3.out",
        scrollTrigger: { trigger: heading, start: "top 85%", once: true },
      });
    });

    if (hasFinePointer && cursor) {
      const cursorLabel = cursor.querySelector(".cursor__label");
      const moveX = gsap.quickTo(cursor, "x", { duration: 0.42, ease: "power3.out" });
      const moveY = gsap.quickTo(cursor, "y", { duration: 0.42, ease: "power3.out" });

      window.addEventListener("pointermove", (event) => {
        moveX(event.clientX);
        moveY(event.clientY);
      });

      const resetCursor = () => {
        cursor.classList.remove("is-large", "is-label", "is-hidden");
        cursorLabel.textContent = "";
      };

      document.querySelectorAll("a, button, [data-cursor]").forEach((element) => {
        element.addEventListener("pointerenter", () => {
          const mode = element.dataset.cursor;
          resetCursor();
          if (mode === "hide") cursor.classList.add("is-hidden");
          else if (mode === "play" || mode === "sayhi") {
            cursor.classList.add("is-label");
            cursorLabel.textContent = mode === "play" ? "Play" : "Say hi";
          } else cursor.classList.add("is-large");
        });
        element.addEventListener("pointerleave", resetCursor);
      });

      document.querySelectorAll(".magnetic").forEach((element) => {
        const pullX = gsap.quickTo(element, "x", { duration: 0.35, ease: "power3.out" });
        const pullY = gsap.quickTo(element, "y", { duration: 0.35, ease: "power3.out" });
        element.addEventListener("pointermove", (event) => {
          const rect = element.getBoundingClientRect();
          pullX((event.clientX - rect.left - rect.width / 2) * 0.14);
          pullY((event.clientY - rect.top - rect.height / 2) * 0.14);
        });
        element.addEventListener("pointerleave", () => {
          gsap.to(element, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1, .35)" });
        });
      });
    }
  }

  const form = document.querySelector("#project-form");
  if (!form) return;

  const errorMessage = form.querySelector(".form-error");
  const formWrap = document.querySelector(".contact__form-wrap");
  const success = formWrap.querySelector(".form-success");
  const submitButton = form.querySelector("button[type='submit']");
  const buttonText = submitButton.querySelector(".button__text");
  let isSubmitting = false;

  function validateForm() {
    let firstInvalid = null;
    form.querySelectorAll("[required]").forEach((field) => {
      const wrapper = field.closest(".form-field");
      const valid = field.value.trim().length > 0;
      wrapper.classList.toggle("is-invalid", !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
      field.addEventListener("input", () => wrapper.classList.remove("is-invalid"), { once: true });
      field.addEventListener("change", () => wrapper.classList.remove("is-invalid"), { once: true });
    });
    if (firstInvalid) {
      errorMessage.textContent = "A few details are missing. Please take another look.";
      firstInvalid.focus();
      return false;
    }
    errorMessage.textContent = "";
    return true;
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    if (window.gsap && !reduceMotion) {
      window.gsap.from(success.children, { y: 12, opacity: 0, stagger: 0.08, duration: 0.45, ease: "power3.out" });
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    if (form.elements.website.value) {
      showSuccess();
      return;
    }

    const endpoint = form.action;

    isSubmitting = true;
    submitButton.disabled = true;
    buttonText.textContent = "Sending...";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error("Form service rejected the request.");
      showSuccess();
      form.reset();
    } catch (error) {
      errorMessage.textContent = "That did not send just now. Please try again or use WhatsApp/email directly.";
      isSubmitting = false;
      submitButton.disabled = false;
      buttonText.textContent = "Send it over";
    }
  });

  formWrap.querySelector("[data-reset-form]").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    form.reset();
    errorMessage.textContent = "";
    isSubmitting = false;
    submitButton.disabled = false;
    buttonText.textContent = "Send it over";
  });
})();
