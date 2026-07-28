(function () {
  "use strict";

  var nav = document.querySelector(".floating-nav");
  var toggle = nav && nav.querySelector(".floating-nav__toggle");
  var panel = nav && nav.querySelector(".floating-nav__mobile-panel");

  function setMenu(open, returnFocus) {
    if (!nav || !toggle || !panel) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.setAttribute("aria-hidden", String(!open));
    if (!open && returnFocus) toggle.focus();
  }

  if (nav && toggle && panel) {
    panel.id = panel.id || "mobile-navigation";
    toggle.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-hidden", "true");

    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"), false);
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false, true);
      }
    });

    document.addEventListener("click", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target)) {
        setMenu(false, false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 991) setMenu(false, false);
    });
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function youtubeId(source) {
    var match = source.match(/(?:embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : "";
  }

  function makePlayer(source, title, options) {
    var iframe = document.createElement("iframe");
    iframe.src = source;
    iframe.title = title;
    iframe.allow = options.allow || "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    return iframe;
  }

  document.querySelectorAll(".cs-video iframe").forEach(function (original, index) {
    var container = original.closest(".cs-video");
    var source = original.getAttribute("src") || original.getAttribute("data-src") || "";
    var id = youtubeId(source);
    var title = original.getAttribute("title") || "Product demonstration video " + (index + 1);
    var interactive = /[?&]controls=1(?:&|$)/.test(source);
    var mode = interactive ? "interactive" : "loop";
    var aspect = getComputedStyle(container).aspectRatio || "";

    container.dataset.videoMode = mode;
    container.dataset.youtubeId = id;
    container.dataset.videoTitle = title;
    if (aspect && aspect !== "auto") container.dataset.aspectRatio = aspect;

    original.remove();

    function showPoster() {
      var poster = document.createElement("img");
      var button = document.createElement("button");
      poster.className = "cs-video__poster";
      poster.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
      poster.alt = "";
      poster.width = 480;
      poster.height = 360;
      poster.loading = "lazy";
      button.className = "cs-video__play";
      button.type = "button";
      button.setAttribute("aria-label", "Play " + title);
      button.appendChild(poster);
      button.addEventListener("click", function () {
        container.classList.remove("is-poster-only");
        container.replaceChildren(makePlayer(source.replace("autoplay=0", "autoplay=1"), title, {}));
      });
      container.replaceChildren(button);
    }

    if (interactive || reducedMotion.matches || !("IntersectionObserver" in window)) {
      if (reducedMotion.matches) container.classList.add("is-poster-only");
      showPoster();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!container.querySelector("iframe")) {
              container.replaceChildren(makePlayer(source, title, {}));
            }
          } else {
            var active = container.querySelector("iframe");
            if (active) active.remove();
          }
        });
      },
      { rootMargin: "320px 0px", threshold: 0.01 }
    );
    observer.observe(container);
  });

  document.querySelectorAll(".contact-form-modern :is(input, textarea)").forEach(function (field) {
    if (field.type === "hidden" || field.type === "submit") return;
    field.addEventListener("invalid", function () {
      field.setAttribute("aria-invalid", "true");
    });
    field.addEventListener("input", function () {
      field.removeAttribute("aria-invalid");
    });
  });
})();
