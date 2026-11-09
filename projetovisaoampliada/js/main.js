(function () {
  "use strict";

  var ROBERTO_WHATSAPP_NUMBER = "5521985230245";
  var EBOOK_CHECKOUT_URL = "https://visaoampliada360.hotmart.host/transforme-seu-faturamento-em-lucro-06963685-6cc6-4f94-bde5-bd712ba862ec";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildSeries(rng, count) {
    var pts = [];
    var smooth = 0.3;
    for (var i = 0; i < count; i++) {
      var t = i / (count - 1);
      var trendY = 0.15 + t * 0.55;
      var jitter = (rng() - 0.5) * 0.5;
      smooth = smooth * 0.7 + (trendY + jitter) * 0.3;
      var noisyY = clamp(smooth + (rng() - 0.5) * 0.15, 0.02, 0.98);
      var threshold = i === 0 ? 0 : rng() * 0.9;
      pts.push({ t: t, trendY: trendY, noisyY: noisyY, threshold: threshold });
    }
    return pts;
  }

  function plot(ctx, w, h, pts, progress) {
    ctx.clearRect(0, 0, w, h);
    var pad = 10;
    var coords = pts.map(function (p) {
      return {
        x: pad + p.t * (w - pad * 2),
        y: h - pad - lerp(p.noisyY, p.trendY, progress) * (h - pad * 2),
        connect: p.threshold <= progress
      };
    });

    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var lineGradient = ctx.createLinearGradient(0, 0, w, 0);
    lineGradient.addColorStop(0, "rgba(38, 34, 57, 0.9)");
    lineGradient.addColorStop(1, "rgba(84, 109, 179, 0.95)");
    ctx.strokeStyle = lineGradient;

    var path = [];
    function flush() {
      if (path.length < 2) { path = []; return; }
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var i = 1; i < path.length - 1; i++) {
        var xc = (path[i].x + path[i + 1].x) / 2;
        var yc = (path[i].y + path[i + 1].y) / 2;
        ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
      }
      var last = path[path.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      path = [];
    }

    coords.forEach(function (c, i) {
      if (i === 0) { path.push(c); return; }
      if (c.connect) { path.push(c); } else { flush(); path.push(c); }
    });
    flush();

    var lastPoint = coords[coords.length - 1];
    ctx.fillStyle = "#546DB3";
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function createGrowthChart(canvas, seed) {
    if (!canvas) return { setProgress: function () {} };
    var ctx = canvas.getContext("2d");
    var rng = mulberry32(seed);
    var points = buildSeries(rng, 48);
    var progress = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function draw() {
      var rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      plot(ctx, rect.width, rect.height, points, progress);
    }
    function resize() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    var ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return {
      setProgress: function (p) {
        progress = clamp(p, 0, 1);
        draw();
      }
    };
  }

  var scheduled = false;
  var frameCallbacks = [];
  function onFrame(cb) { frameCallbacks.push(cb); }
  function requestTick() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      frameCallbacks.forEach(function (cb) { cb(); });
    });
  }
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  function trackProgress(trackEl) {
    if (!trackEl) return 0;
    var rect = trackEl.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return 1;
    return clamp(-rect.top / total, 0, 1);
  }

  var progressFill = document.querySelector(".progressBar__fill");
  onFrame(function () {
    if (!progressFill) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var frac = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    progressFill.style.transform = "scaleX(" + frac + ")";
  });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.setAttribute("data-revealed", "true");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    if (reducedMotion) { el.setAttribute("data-revealed", "true"); }
    else { revealObserver.observe(el); }
  });

  function createHeroChart(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var months = 24;
    var profit = [];
    for (var i = 0; i < months; i++) {
      var t = i / (months - 1);
      profit.push(0.1 + Math.pow(t, 1.35) * 0.62 + Math.sin(i * 1.3 + 1) * 0.02);
    }
    var reveal = reducedMotion ? 1 : 0;

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      var left = w * 0.04;
      var right = w * 0.96;
      var top = h * 0.2;
      var bottom = h * 0.86;
      var step = (right - left) / months;
      function x(i) { return left + step * (i + 0.5); }
      function y(v) { return bottom - v * (bottom - top); }

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, left + (right - left) * reveal, h);
      ctx.clip();

      function tracePath() {
        ctx.moveTo(x(0), y(profit[0]));
        for (var i = 0; i < months - 1; i++) {
          var mx = (x(i) + x(i + 1)) / 2;
          ctx.bezierCurveTo(mx, y(profit[i]), mx, y(profit[i + 1]), x(i + 1), y(profit[i + 1]));
        }
      }

      var line = ctx.createLinearGradient(left, 0, right, 0);
      line.addColorStop(0, "rgba(84, 109, 179, 0.6)");
      line.addColorStop(1, "rgba(129, 153, 219, 1)");
      ctx.beginPath();
      tracePath();
      ctx.strokeStyle = line;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.restore();
    }

    function resize() {
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    if (!reducedMotion) {
      var start = null;
      requestAnimationFrame(function animate(ts) {
        if (start === null) start = ts;
        var t = clamp((ts - start) / 1800, 0, 1);
        reveal = 1 - Math.pow(1 - t, 3);
        draw();
        if (t < 1) requestAnimationFrame(animate);
      });
    }
  }
  createHeroChart(document.getElementById("heroChart"));

  var heroContent = document.querySelector(".hero__container");
  onFrame(function () {
    if (!heroContent || reducedMotion) return;
    var frac = clamp(window.scrollY / 900, 0, 1);
    heroContent.style.transform = "translateY(" + (frac * 40) + "px)";
    heroContent.style.opacity = String(1 - frac * 0.7);
  });

  var robertoSection = document.getElementById("roberto");
  if (robertoSection) {
    var photoStage = robertoSection.querySelector(".roberto__photoStage");
    var textBlock = robertoSection.querySelector(".roberto__text");
    var robertoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (photoStage) photoStage.classList.add("is-revealed");
          if (textBlock) textBlock.classList.add("is-revealed");
          robertoObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    if (reducedMotion) {
      if (photoStage) photoStage.classList.add("is-revealed");
      if (textBlock) textBlock.classList.add("is-revealed");
    } else {
      robertoObserver.observe(robertoSection);
    }
  }

  var EXPERIENCE_ENTRIES = [
    { logo: "assets/outbacklogo.png", role: "Gestor Operacional, Contratação e Treinamento", company: "Outback" },
    { logo: "assets/grupometodologo.png", role: "Gestor de Franquias e Gestor Comercial", company: "Grupo Método" },
    { logo: "assets/cocomambologo.png", role: "Contratação e Treinamento", company: "Grupo Cocomambo" }
  ];
  var trailIndex = 0;
  var trailLogo = document.querySelector(".experienceTrail__logo");
  var trailMeta = document.querySelector(".experienceTrail__meta");
  var trailPrev = document.querySelector(".experienceTrail__navButton--prev");
  var trailNext = document.querySelector(".experienceTrail__navButton--next");
  var trailDots = document.querySelectorAll(".experienceTrail__dot");

  // Todas as experiências ficam empilhadas no mesmo espaço, e só a ativa aparece.
  // Assim o card sempre tem a altura da maior delas e não "pula" ao trocar.
  var trailItems = [];
  if (trailMeta) {
    trailMeta.innerHTML = "";
    EXPERIENCE_ENTRIES.forEach(function (entry) {
      var item = document.createElement("div");
      item.className = "experienceTrail__metaItem";
      var role = document.createElement("strong");
      role.textContent = entry.role;
      var company = document.createElement("span");
      company.textContent = entry.company;
      item.appendChild(role);
      item.appendChild(company);
      trailMeta.appendChild(item);
      trailItems.push(item);
    });
  }

  function renderTrail() {
    var entry = EXPERIENCE_ENTRIES[trailIndex];
    if (trailLogo) trailLogo.src = entry.logo;
    trailItems.forEach(function (item, i) {
      var active = i === trailIndex;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-hidden", active ? "false" : "true");
    });
    trailDots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === trailIndex);
    });
    if (trailPrev) trailPrev.disabled = trailIndex === 0;
    if (trailNext) trailNext.disabled = trailIndex === EXPERIENCE_ENTRIES.length - 1;
  }
  if (trailPrev) trailPrev.addEventListener("click", function () {
    if (trailIndex > 0) { trailIndex--; renderTrail(); }
  });
  if (trailNext) trailNext.addEventListener("click", function () {
    if (trailIndex < EXPERIENCE_ENTRIES.length - 1) { trailIndex++; renderTrail(); }
  });
  trailDots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { trailIndex = i; renderTrail(); });
  });
  if (trailLogo) renderTrail();

  var methodTrack = document.getElementById("metodoTrack");
  var methodChart = createGrowthChart(document.getElementById("metodoChart"), 3);
  var methodSteps = document.querySelectorAll(".method__step");
  var methodDots = document.querySelectorAll(".method__dot");
  var methodLive = document.getElementById("metodoLive");
  var lastMethodStep = -1;

  onFrame(function () {
    if (!methodTrack) return;
    var p = trackProgress(methodTrack);
    var lastIndex = methodSteps.length - 1;
    var stepFloat = reducedMotion ? 0 : p * lastIndex;

    methodSteps.forEach(function (step, i) {
      var opacity = reducedMotion
        ? (i === 0 ? 1 : 0)
        : Math.max(0, 1 - Math.abs(stepFloat - i) * 1.8);
      step.style.opacity = String(opacity);
      step.classList.toggle("is-current", opacity > 0.5);
    });

    methodChart.setProgress(reducedMotion ? 1 : clamp(stepFloat / lastIndex, 0, 1));

    var activeIndex = clamp(Math.round(stepFloat), 0, lastIndex);
    methodDots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === activeIndex); });

    if (methodLive && activeIndex !== lastMethodStep) {
      lastMethodStep = activeIndex;
      var titleEl = methodSteps[activeIndex] && methodSteps[activeIndex].querySelector(".method__stepTitle");
      if (titleEl) methodLive.textContent = titleEl.textContent;
    }
  });

  document.querySelectorAll(".faq__trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var item = trigger.closest(".faq__item");
      var expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      item.classList.toggle("is-open", !expanded);
    });
  });

  function whatsappUrl(message) {
    return "https://wa.me/" + ROBERTO_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  var MENTORIA_MESSAGES = {
    "financas-pessoais": "Olá, Roberto! Vim pelo site da Visão Ampliada e tenho interesse na *Mentoria Finanças Pessoais* (2 meses). Quero organizar minha vida financeira com análise, diagnóstico, estratégias e um painel de controle. Pode me explicar como funciona?",
    "prata": "Olá, Roberto! Vim pelo site da Visão Ampliada e tenho interesse na *Mentoria Prata* (3 meses). Quero entender melhor os números do meu negócio com análise, diagnóstico e estratégias. Podemos conversar sobre os próximos passos?",
    "ouro": "Olá, Roberto! Vim pelo site da Visão Ampliada e tenho interesse na *Mentoria Ouro* (4 meses). Além da análise e das estratégias, quero incluir as aulas para a minha equipe e os ebooks. Pode me passar mais detalhes?",
    "premium": "Olá, Roberto! Vim pelo site da Visão Ampliada e tenho interesse na *Mentoria Premium* (6 meses). Busco um acompanhamento completo do meu negócio, com treinamento e gerenciamento de DRE. Quando podemos conversar?"
  };

  document.querySelectorAll(".plans__cta").forEach(function (cta) {
    var message = MENTORIA_MESSAGES[cta.getAttribute("data-mentoria")];
    if (!message) return;
    cta.href = whatsappUrl(message);
    cta.target = "_blank";
    cta.rel = "noopener";
  });

  var leadForm = document.getElementById("leadForm");
  var leadSuccess = document.getElementById("leadFormSuccess");
  var diag = leadForm && leadForm.closest(".diag");

  if (leadForm && diag) {
    var steps = leadForm.querySelectorAll(".diag__step");
    var bars = leadForm.querySelectorAll(".diag__bar");
    var stepNum = document.getElementById("diagStepNum");
    var backButton = leadForm.querySelector(".diag__back");
    var nextButton = leadForm.querySelector(".diag__next");
    var hint = leadForm.querySelector(".diag__hint");
    var nameInput = leadForm.querySelector("#leadName");
    var emailInput = leadForm.querySelector("#leadEmail");
    var segmentInputs = leadForm.querySelectorAll('input[name="segment"]');
    var currentStep = 0;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    diag.classList.add("is-enhanced");

    function segmentValue() {
      var checked = leadForm.querySelector('input[name="segment"]:checked');
      return checked ? checked.value : "";
    }

    var validators = [
      function () { return nameInput.value.trim().length >= 2 ? "" : "Informe seu nome."; },
      function () { return emailRegex.test(emailInput.value.trim()) ? "" : "Informe um e-mail válido."; },
      function () { return segmentValue() ? "" : "Selecione um segmento."; }
    ];
    function setError(index, message) {
      var errorEl = steps[index].querySelector(".diag__error");
      if (errorEl) errorEl.textContent = message || "";
      steps[index].classList.toggle("has-error", !!message);
    }

    function focusStep(index) {
      var target = index === steps.length - 1
        ? leadForm.querySelector('input[name="segment"]:checked') || segmentInputs[0]
        : steps[index].querySelector(".diag__input");
      if (target) target.focus({ preventScroll: true });
    }

    function goTo(index) {
      currentStep = index;
      steps.forEach(function (step, i) {
        step.classList.toggle("is-active", i === index);
      });
      bars.forEach(function (bar, i) {
        bar.classList.toggle("is-active", i <= index);
      });
      if (stepNum) stepNum.textContent = "0" + (index + 1);
      if (backButton) backButton.hidden = index === 0;
      var last = index === steps.length - 1;
      if (nextButton) nextButton.textContent = last ? "Enviar pelo WhatsApp →" : "Continuar →";
      if (hint) hint.hidden = last;
      focusStep(index);
    }

    [nameInput, emailInput].forEach(function (input, i) {
      input.addEventListener("input", function () {
        if (steps[i].classList.contains("has-error") && !validators[i]()) setError(i, "");
      });
    });
    segmentInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        setError(2, "");
      });
    });

    if (backButton) backButton.addEventListener("click", function () {
      if (currentStep > 0) goTo(currentStep - 1);
    });

    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var error = validators[currentStep]();
      setError(currentStep, error);
      if (error) {
        steps[currentStep].classList.remove("shake");
        void steps[currentStep].offsetWidth;
        steps[currentStep].classList.add("shake");
        return;
      }
      if (currentStep < steps.length - 1) { goTo(currentStep + 1); return; }

      var message = "Olá, Roberto! Acabei de preencher o diagnóstico no site da Visão Ampliada.\n\n" +
        "*Nome:* " + nameInput.value.trim() + "\n" +
        "*E-mail:* " + emailInput.value.trim() + "\n" +
        "*Segmento:* " + segmentValue() + "\n\n" +
        "Gostaria de conversar sobre o momento financeiro do meu negócio.";
      var url = whatsappUrl(message);
      window.open(url, "_blank", "noopener");

      diag.classList.add("is-submitted");
      if (leadSuccess) {
        var whatsappLink = leadSuccess.querySelector(".leadForm__whatsappLink");
        if (whatsappLink) whatsappLink.href = url;
        leadSuccess.focus({ preventScroll: true });
      }
    });

  }

  var ebookButton = document.getElementById("ebookCta");
  if (ebookButton) {
    if (EBOOK_CHECKOUT_URL) {
      ebookButton.href = EBOOK_CHECKOUT_URL;
    } else {
      ebookButton.setAttribute("aria-disabled", "true");
      ebookButton.addEventListener("click", function (e) { e.preventDefault(); });
    }
  }

  var yearEl = document.getElementById("footerYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  requestTick();
})();
