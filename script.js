// Moonlight Ayışığı — ortak arayüz davranışları

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".site-header");
  var nav = header ? header.querySelector("nav") : null;
  var toggle = document.querySelector(".menu-toggle");

  // 1) Scroll'da header'ı koyulaştır
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // 2) Mobil menü aç/kapat
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 3) Aktif sayfa linkini işaretle
  if (nav) {
    var current = (window.location.pathname.split("/").pop() || "index.html");
    nav.querySelectorAll("a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === current || (current === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  // 4) Scroll'da içeriği belirginleştir (reveal)
  var revealEls = document.querySelectorAll(".reveal");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) { observer.observe(el); });
    }
  }

  // 5) Oda fotoğrafları kaydırmalı galeri (carousel)
  var roomCarousels = document.querySelectorAll(".room-carousel");
  var AUTOPLAY_DELAY = 4000; // 4 saniye

  roomCarousels.forEach(function (carousel) {
    var slides = carousel.querySelectorAll(".carousel-slide");
    var dots = carousel.querySelectorAll(".dot");
    var prevBtn = carousel.querySelector(".carousel-arrow.prev");
    var nextBtn = carousel.querySelector(".carousel-arrow.next");
    var current = 0;
    var isVideoCarousel = carousel.querySelector(".video-slide") !== null;
    var autoplayTimer = null;

    if (!slides.length) return;

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      if (isVideoCarousel || slides.length <= 1) return;
      stopAutoplay();
      autoplayTimer = setInterval(function () {
        goTo(current + 1);
      }, AUTOPLAY_DELAY);
    }

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      // Slaytlar arasında geçiş yapılırken, geride kalan slayttaki
      // video varsa (Çanakkale videoları) onu durdur.
      var outgoingVideo = slides[current].querySelector("video");
      if (outgoingVideo) outgoingVideo.pause();

      slides[current].classList.remove("active");
      if (dots[current]) dots[current].classList.remove("active");
      current = index;
      slides[current].classList.add("active");
      if (dots[current]) dots[current].classList.add("active");
    }

    function manualGoTo(index) {
      goTo(index);
      startAutoplay(); // elle gezinme sonrası zamanlayıcıyı sıfırla
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () { manualGoTo(current - 1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () { manualGoTo(current + 1); });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { manualGoTo(i); });
    });

    startAutoplay();
  });

  // 5b) Videolar: varsayılan ses kapalı gelsin, oynatılınca ses açılsın;
  // başka bir video oynatılırken diğerleri otomatik durdurulsun.
  var allVideos = document.querySelectorAll(".carousel-video");
  allVideos.forEach(function (video) {
    video.addEventListener("play", function () {
      video.muted = false;
      allVideos.forEach(function (other) {
        if (other !== video && !other.paused) {
          other.pause();
        }
      });
    });
  });

  // 6) Fotoğraf büyütme (lightbox)
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lightboxContent = lightbox.querySelector(".lightbox-content");
    var lightboxClose = lightbox.querySelector(".lightbox-close");
    var lightboxPrev = lightbox.querySelector(".lightbox-nav.prev");
    var lightboxNext = lightbox.querySelector(".lightbox-nav.next");
    var currentGroup = [];
    var currentIndex = 0;

    function renderLightbox() {
      var item = currentGroup[currentIndex];
      if (!item || !lightboxContent) return;
      lightboxContent.innerHTML = item.innerHTML;
      var hasMultiple = currentGroup.length > 1;
      if (lightboxPrev) lightboxPrev.style.display = hasMultiple ? "flex" : "none";
      if (lightboxNext) lightboxNext.style.display = hasMultiple ? "flex" : "none";
    }

    function openLightbox(group, index) {
      currentGroup = group;
      currentIndex = index;
      renderLightbox();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function showNext() {
      if (!currentGroup.length) return;
      currentIndex = (currentIndex + 1) % currentGroup.length;
      renderLightbox();
    }

    function showPrev() {
      if (!currentGroup.length) return;
      currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
      renderLightbox();
    }

    // Genel fotoğraflar (Resepsiyon / Dış Bina / Sokak) — kendi grubu
    document.querySelectorAll(".gallery-grid-3").forEach(function (grid) {
      var items = Array.prototype.slice.call(grid.querySelectorAll(".photo-placeholder"));
      items.forEach(function (item, i) {
        item.addEventListener("click", function () { openLightbox(items, i); });
      });
    });

    // Oda fotoğrafları — her oda tipi kendi grubu, içinde de gezinilebilir (videolar hariç)
    document.querySelectorAll(".room-carousel").forEach(function (carousel) {
      var items = Array.prototype.slice.call(
        carousel.querySelectorAll(".carousel-slide:not(.video-slide)")
      );
      items.forEach(function (item, i) {
        item.addEventListener("click", function () { openLightbox(items, i); });
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener("click", showNext);
    if (lightboxPrev) lightboxPrev.addEventListener("click", showPrev);

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    });
  }

  // 7) Dil değiştirme (TR / EN) — seçim sayfalar arasında hatırlanır
  var LANG_KEY = "moonlight-lang";
  var langButtons = document.querySelectorAll(".lang-btn");

  function getSavedLang() {
    var saved = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch (err) {
      saved = null;
    }
    return saved === "en" ? "en" : "tr";
  }

  function setLang(lang) {
    lang = lang === "en" ? "en" : "tr";

    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (typeof el.dataset.tr === "undefined") {
        el.dataset.tr = el.innerHTML;
      }
      el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.tr;
    });

    langButtons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (err) {
      /* localStorage kullanılamıyorsa sessizce geç */
    }
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLang(btn.getAttribute("data-lang"));
    });
  });

  if (langButtons.length) {
    setLang(getSavedLang());
  }
});
