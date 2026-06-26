(() => {
  "use strict";

  const data = window.SUPPORT_DATA;
  const storagePrefix = "insultResponseGuide.";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    activeSituationId: null,
    activePhraseCategory: "calm",
    activeEnvironment: "all",
    activeIntensity: "all",
    librarySearch: "",
    coachIndex: 0,
    breath: {
      timerId: null,
      total: 60,
      remaining: 60,
      running: false,
      phaseIndex: 0,
    },
  };

  const breathPhases = [
    { name: "Вдих", className: "inhale", seconds: 4, hint: "Вдихай повільно. Плечі не треба піднімати." },
    { name: "Пауза", className: "hold", seconds: 2, hint: "Затримай м’яко, без напруги." },
    { name: "Видих", className: "exhale", seconds: 6, hint: "Видихай довше, ніж вдихаєш." },
  ];

  function storageKey(key) {
    return `${storagePrefix}${key}`;
  }

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(storageKey(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch (error) {
      // localStorage може бути недоступним у приватному режимі; сайт має працювати і без нього.
    }
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) {
      element.className = options.className;
    }
    if (options.text) {
      element.textContent = options.text;
    }
    if (options.html) {
      element.innerHTML = options.html;
    }
    if (options.attrs) {
      Object.entries(options.attrs).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    return element;
  }

  function renderList(items) {
    const list = createElement("ul", { className: "card-list" });
    items.forEach((item) => {
      list.append(createElement("li", { text: item }));
    });
    return list;
  }

  function initTheme() {
    const savedTheme = readStorage("theme", null);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(theme);

    $("#themeToggle")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next);
      writeStorage("theme", next);
    });
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const toggle = $("#themeToggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  function initNavigation() {
    const nav = $("#siteNav");
    const toggle = $("#navToggle");

    toggle?.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    $$("#siteNav a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });

    const sections = $$("#main section[id]");
    const navLinks = $$("#siteNav a");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initScrollProgress() {
    const progress = $("#readProgressBar");
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
      progress.style.width = `${percent}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initRevealAnimations() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
  }

  function initStats() {
    const root = $("#heroStats");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.stats.forEach((stat) => {
      const card = createElement("article", { className: "stat-card" });
      const value = createElement("strong", { text: "0", attrs: { "data-target": stat.value } });
      const label = createElement("span", { text: stat.label });
      card.append(value, label);
      root.append(card);
    });

    const counters = $$("[data-target]", root);
    let animated = false;
    const animate = () => {
      if (animated) {
        return;
      }
      animated = true;
      counters.forEach((counter) => {
        const target = Number(counter.dataset.target || 0);
        const duration = 900;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min(1, (now - start) / duration);
          counter.textContent = String(Math.round(target * easeOutCubic(progress)));
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(root);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function initSituationTest() {
    const optionsRoot = $("#situationOptions");
    if (!optionsRoot) {
      return;
    }

    optionsRoot.innerHTML = "";
    data.requiredSituations.forEach((situation, index) => {
      const button = createElement("button", {
        className: "situation-option",
        attrs: {
          type: "button",
          "data-situation-id": situation.id,
          role: "listitem",
        },
      });
      button.innerHTML = `
        <span class="situation-index">${String(index + 1).padStart(2, "0")}</span>
        <span>
          <strong>${situation.label}</strong>
          <small>${situation.place} · ${situation.tone}</small>
        </span>
      `;
      button.addEventListener("click", () => selectSituation(situation.id));
      optionsRoot.append(button);
    });
  }

  function selectSituation(id) {
    const situation = data.requiredSituations.find((item) => item.id === id);
    if (!situation) {
      return;
    }

    state.activeSituationId = id;
    $$(".situation-option").forEach((button) => {
      button.classList.toggle("active", button.dataset.situationId === id);
    });

    const panel = $("#situationResult");
    panel.innerHTML = "";
    panel.append(createElement("p", { className: "eyebrow", text: "Персональна порада" }));
    panel.append(createElement("h3", { text: situation.label }));
    panel.append(createElement("p", { text: situation.summary }));

    const meta = createElement("div", { className: "result-meta" });
    meta.append(createElement("span", { className: "chip", text: situation.place }));
    meta.append(createElement("span", { className: "chip warm", text: situation.tone }));
    meta.append(createElement("span", { className: "chip coral", text: "без відповіді агресією" }));
    panel.append(meta);

    const phrase = createElement("div", { className: "generated-phrase" });
    phrase.innerHTML = `<strong>Перша фраза:</strong><span>${situation.firstLine}</span>`;
    panel.append(phrase);

    const columns = createElement("div", { className: "advice-columns" });
    columns.append(makeAdviceBox("Що зробити", situation.personalAdvice));
    columns.append(makeAdviceBox("Безпечні кроки", situation.safeSteps));
    columns.append(makeAdviceBox("Можна сказати", situation.say));
    columns.append(makeAdviceBox("Уникати", situation.avoid));
    panel.append(columns);

    const actions = createElement("div", { className: "hero-actions" });
    const checklistLink = createElement("a", { className: "primary-button small", text: "Перейти до чекліста", attrs: { href: "#checklist" } });
    const calmLink = createElement("a", { className: "secondary-button small", text: "Заспокоїтись", attrs: { href: "#calm" } });
    actions.append(checklistLink, calmLink);
    panel.append(actions);
  }

  function makeAdviceBox(title, items) {
    const box = createElement("div", { className: "advice-box" });
    box.append(createElement("h4", { text: title }));
    box.append(renderList(items));
    return box;
  }

  function initPhrases() {
    renderPhraseTabs();
    renderPhraseGrid();
    $("#generatePhraseButton")?.addEventListener("click", generatePhrase);
  }

  function renderPhraseTabs() {
    const root = $("#phraseTabs");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.phraseCategories.forEach((category) => {
      const button = createElement("button", {
        className: "tab-button",
        text: category.label,
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": String(category.id === state.activePhraseCategory),
        },
      });
      button.addEventListener("click", () => {
        state.activePhraseCategory = category.id;
        renderPhraseTabs();
        renderPhraseGrid();
      });
      root.append(button);
    });
  }

  function renderPhraseGrid() {
    const root = $("#phraseGrid");
    if (!root) {
      return;
    }

    const category = data.phraseCategories.find((item) => item.id === state.activePhraseCategory);
    const phrases = data.phraseBank.filter((phrase) => phrase.category === state.activePhraseCategory);
    root.innerHTML = "";

    const intro = createElement("article", { className: "phrase-card" });
    intro.innerHTML = `
      <span class="chip">${category.label}</span>
      <blockquote>${category.intro}</blockquote>
      <p>Обери фразу, яка звучить природно для тебе. Її можна скоротити до кількох слів.</p>
    `;
    root.append(intro);

    phrases.forEach((phrase) => {
      const card = createElement("article", { className: "phrase-card" });
      card.innerHTML = `
        <span class="chip">${category.label}</span>
        <blockquote>“${phrase.text}”</blockquote>
        <p>${phrase.when}</p>
        <footer>${phrase.after}</footer>
      `;
      root.append(card);
    });
  }

  function generatePhrase() {
    const selectedContext = $("#phraseContext")?.value || "any";
    let pool = data.phraseBank;
    if (selectedContext === "online") {
      pool = pool.filter((phrase) => /модерац|коментар|чат|онлайн|зафіксовано|скарг/i.test(`${phrase.text} ${phrase.when}`));
    } else if (selectedContext === "school") {
      pool = pool.filter((phrase) => phrase.category !== "noAnswer" || /доросл|повтор/i.test(`${phrase.text} ${phrase.when}`));
    } else if (selectedContext === "friends") {
      pool = pool.filter((phrase) => phrase.category === "calm" || phrase.category === "nonConflict");
    } else if (selectedContext === "family") {
      pool = pool.filter((phrase) => phrase.category !== "confident" || phrase.text.length < 48);
    }

    if (!pool.length) {
      pool = data.phraseBank;
    }

    const phrase = pickRandom(pool);
    const category = data.phraseCategories.find((item) => item.id === phrase.category);
    const output = $("#generatedPhrase");
    output.innerHTML = `
      <div>
        <span>${category.label}</span>
        <strong>“${phrase.text}”</strong>
      </div>
      <button class="ghost-button small" type="button" id="copyGeneratedPhrase">Скопіювати</button>
    `;

    $("#copyGeneratedPhrase")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(phrase.text);
        $("#copyGeneratedPhrase").textContent = "Скопійовано";
      } catch (error) {
        $("#copyGeneratedPhrase").textContent = "Виділи вручну";
      }
    });
  }

  function initNotToDo() {
    const root = $("#notToDoGrid");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.notToDo.forEach((item) => {
      const card = createElement("article", { className: "warning-card" });
      card.innerHTML = `
        <h3>${item.title}</h3>
        <p><strong>Чому:</strong> ${item.why}</p>
        <p><strong>Замість цього:</strong> ${item.instead}</p>
      `;
      root.append(card);
    });
  }

  function initFiveMinutePlan() {
    renderTimeline();
    renderCoach();

    $("#nextStepButton")?.addEventListener("click", () => {
      state.coachIndex = Math.min(data.fiveMinutePlan.length - 1, state.coachIndex + 1);
      renderCoach();
    });

    $("#prevStepButton")?.addEventListener("click", () => {
      state.coachIndex = Math.max(0, state.coachIndex - 1);
      renderCoach();
    });

    $("#resetStepButton")?.addEventListener("click", () => {
      state.coachIndex = 0;
      renderCoach();
    });
  }

  function renderTimeline() {
    const root = $("#fiveMinuteTimeline");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.fiveMinutePlan.forEach((step) => {
      const item = createElement("article", { className: "timeline-item" });
      item.innerHTML = `
        <span class="timeline-time">${step.minute}</span>
        <div>
          <h3>${step.title}</h3>
          <p>${step.body}</p>
          <small>${step.micro}</small>
        </div>
      `;
      root.append(item);
    });
  }

  function renderCoach() {
    const step = data.fiveMinutePlan[state.coachIndex];
    $("#coachTitle").textContent = `${state.coachIndex + 1}. ${step.title}`;
    $("#coachBody").textContent = step.body;
    $("#coachProgressBar").style.width = `${((state.coachIndex + 1) / data.fiveMinutePlan.length) * 100}%`;
    $("#prevStepButton").disabled = state.coachIndex === 0;
    $("#nextStepButton").disabled = state.coachIndex === data.fiveMinutePlan.length - 1;
  }

  function initBreathing() {
    $("#startBreathingButton")?.addEventListener("click", startBreathing);
    $("#pauseBreathingButton")?.addEventListener("click", pauseBreathing);
    $("#resetBreathingButton")?.addEventListener("click", resetBreathing);
    renderBreathing();
  }

  function startBreathing() {
    if (state.breath.running) {
      return;
    }
    state.breath.running = true;
    if (state.breath.remaining <= 0) {
      state.breath.remaining = state.breath.total;
      state.breath.phaseIndex = 0;
    }
    state.breath.timerId = window.setInterval(() => {
      state.breath.remaining -= 1;
      if (state.breath.remaining <= 0) {
        pauseBreathing();
        state.breath.remaining = 0;
      }
      renderBreathing();
    }, 1000);
    renderBreathing();
  }

  function pauseBreathing() {
    state.breath.running = false;
    if (state.breath.timerId) {
      window.clearInterval(state.breath.timerId);
      state.breath.timerId = null;
    }
    renderBreathing();
  }

  function resetBreathing() {
    pauseBreathing();
    state.breath.remaining = state.breath.total;
    state.breath.phaseIndex = 0;
    renderBreathing();
  }

  function renderBreathing() {
    const elapsed = state.breath.total - state.breath.remaining;
    const cycleLength = breathPhases.reduce((sum, phase) => sum + phase.seconds, 0);
    let cursor = elapsed % cycleLength;
    let phase = breathPhases[0];

    for (const item of breathPhases) {
      if (cursor < item.seconds) {
        phase = item;
        break;
      }
      cursor -= item.seconds;
    }

    const circle = $("#breathCircle");
    circle.classList.remove("inhale", "hold", "exhale");
    if (state.breath.running) {
      circle.classList.add(phase.className);
    }

    $("#breathPhase").textContent = state.breath.running ? phase.name : state.breath.remaining === 0 ? "Готово" : "Пауза";
    $("#breathTimer").textContent = String(state.breath.remaining);
    $("#breathHint").textContent = state.breath.running ? phase.hint : "Коли натиснеш старт, коло підкаже темп.";
    $("#breathProgressBar").style.width = `${((state.breath.total - state.breath.remaining) / state.breath.total) * 100}%`;
  }

  function initEmotionSupport() {
    const root = $("#emotionGrid");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.emotions.forEach((emotion) => {
      const button = createElement("button", {
        className: "emotion-button",
        attrs: {
          type: "button",
          "data-emotion-id": emotion.id,
        },
      });
      button.innerHTML = `${emotion.label}<span>${emotion.headline}</span>`;
      button.addEventListener("click", () => selectEmotion(emotion.id));
      root.append(button);
    });

    const saved = readStorage("emotion", null);
    if (saved && data.emotions.some((emotion) => emotion.id === saved)) {
      selectEmotion(saved);
    }
  }

  function selectEmotion(id) {
    const emotion = data.emotions.find((item) => item.id === id);
    if (!emotion) {
      return;
    }

    writeStorage("emotion", id);
    $$(".emotion-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.emotionId === id);
    });

    const panel = $("#emotionResult");
    panel.innerHTML = "";
    panel.append(createElement("p", { className: "eyebrow", text: emotion.label }));
    panel.append(createElement("h3", { text: emotion.headline }));
    panel.append(createElement("p", { text: emotion.support }));

    const actions = createElement("div", { className: "emotion-actions" });
    emotion.actions.forEach((action) => {
      actions.append(createElement("div", { className: "emotion-action", text: action }));
    });
    panel.append(actions);
  }

  function initChecklist() {
    const saved = readStorage("checklist", []);
    const root = $("#checklistItems");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.checklist.forEach((item) => {
      const id = `check-${item.id}`;
      const label = createElement("label", { className: "check-item", attrs: { for: id } });
      label.innerHTML = `
        <input id="${id}" type="checkbox" value="${item.id}" ${saved.includes(item.id) ? "checked" : ""} />
        <span>
          <strong>${item.text}</strong>
          <small>${item.detail}</small>
        </span>
      `;
      root.append(label);
    });

    root.addEventListener("change", () => {
      const checked = $$("input:checked", root).map((input) => input.value);
      writeStorage("checklist", checked);
      updateChecklistProgress();
    });

    $("#resetChecklistButton")?.addEventListener("click", () => {
      $$("input", root).forEach((input) => {
        input.checked = false;
      });
      writeStorage("checklist", []);
      updateChecklistProgress();
    });

    updateChecklistProgress();
  }

  function updateChecklistProgress() {
    const total = data.checklist.length;
    const checked = $$("#checklistItems input:checked").length;
    const percent = total ? Math.round((checked / total) * 100) : 0;
    $("#checklistProgressText").textContent = `${percent}%`;
    $("#checklistProgressBar").style.width = `${percent}%`;
  }

  function initHelpSignals() {
    const root = $("#helpGrid");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.helpSignals.forEach((item) => {
      const card = createElement("article", { className: "help-card" });
      card.innerHTML = `<h3>${item.title}</h3><p>${item.body}</p>`;
      root.append(card);
    });
  }

  function initLibrary() {
    renderEnvironmentFilters();
    renderIntensityOptions();
    renderLibrary();

    $("#situationSearch")?.addEventListener("input", (event) => {
      state.librarySearch = event.target.value.trim().toLowerCase();
      renderLibrary();
    });

    $("#intensityFilter")?.addEventListener("change", (event) => {
      state.activeIntensity = event.target.value;
      renderLibrary();
    });
  }

  function renderEnvironmentFilters() {
    const root = $("#environmentFilters");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.filters.environments.forEach((filter) => {
      const button = createElement("button", {
        className: `filter-button${filter.id === state.activeEnvironment ? " active" : ""}`,
        text: filter.label,
        attrs: {
          type: "button",
        },
      });
      button.addEventListener("click", () => {
        state.activeEnvironment = filter.id;
        renderEnvironmentFilters();
        renderLibrary();
      });
      root.append(button);
    });
  }

  function renderIntensityOptions() {
    const select = $("#intensityFilter");
    if (!select) {
      return;
    }

    select.innerHTML = data.filters.intensity
      .map((filter) => `<option value="${filter.id}">${filter.label}</option>`)
      .join("");
    select.value = state.activeIntensity;
  }

  function getFilteredCards() {
    return data.situationCards.filter((card) => {
      const environmentMatch = state.activeEnvironment === "all" || card.environment === state.activeEnvironment;
      const intensityMatch = state.activeIntensity === "all" || card.intensity === state.activeIntensity;
      const haystack = [
        card.title,
        card.short,
        card.firstResponse,
        card.boundary,
        card.evidence,
        card.helper,
        card.nextStep,
        card.practice,
        card.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const searchMatch = !state.librarySearch || haystack.includes(state.librarySearch);
      return environmentMatch && intensityMatch && searchMatch;
    });
  }

  function renderLibrary() {
    const root = $("#situationLibrary");
    if (!root) {
      return;
    }

    const cards = getFilteredCards();
    $("#libraryCount").textContent = String(cards.length);
    root.innerHTML = "";

    if (!cards.length) {
      const empty = createElement("article", { className: "library-card" });
      empty.innerHTML = `
        <h3>Нічого не знайдено</h3>
        <p>Спробуй інше слово або скинь фільтр на “Усі”.</p>
      `;
      root.append(empty);
      return;
    }

    cards.forEach((card) => {
      const item = createElement("article", { className: "library-card" });
      item.innerHTML = `
        <div class="meta-row">
          <span class="chip">${card.environmentLabel}</span>
          <span class="chip warm">${card.intensityLabel}</span>
        </div>
        <h3>${card.title}</h3>
        <p>${card.short}</p>
        <p class="phrase-line">${card.firstResponse}</p>
        <p>${card.boundary}</p>
        <details>
          <summary>Детальніше</summary>
          <p>${card.evidence}</p>
          <p>${card.helper}</p>
          <p>${card.nextStep}</p>
          <p>${card.practice}</p>
        </details>
      `;
      root.append(item);
    });
  }

  function initFaq() {
    const root = $("#faqList");
    if (!root) {
      return;
    }

    root.innerHTML = "";
    data.faq.forEach((item, index) => {
      const faqItem = createElement("article", { className: "faq-item" });
      const questionId = `faq-question-${index}`;
      const answerId = `faq-answer-${index}`;
      faqItem.innerHTML = `
        <button class="faq-question" id="${questionId}" type="button" aria-expanded="false" aria-controls="${answerId}">
          <span>${item.question}</span>
          <strong aria-hidden="true">+</strong>
        </button>
        <div class="faq-answer" id="${answerId}" role="region" aria-labelledby="${questionId}">
          <p>${item.answer}</p>
        </div>
      `;
      root.append(faqItem);
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest(".faq-question");
      if (!button) {
        return;
      }
      const item = button.closest(".faq-item");
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
    });
  }

  function initModal() {
    $("#openTipFromHero")?.addEventListener("click", () => openTipModal("day"));
    $("#quickAdviceButton")?.addEventListener("click", () => openTipModal("quick"));
    $("#modalAnotherButton")?.addEventListener("click", () => {
      const mode = $("#modalBackdrop")?.dataset.mode || "day";
      openTipModal(mode);
    });
    $("#modalOkButton")?.addEventListener("click", closeModal);
    $("#modalCloseButton")?.addEventListener("click", closeModal);
    $("#modalBackdrop")?.addEventListener("click", (event) => {
      if (event.target.id === "modalBackdrop") {
        closeModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#modalBackdrop").hidden) {
        closeModal();
      }
    });
  }

  function openTipModal(mode) {
    const backdrop = $("#modalBackdrop");
    const isQuick = mode === "quick";
    backdrop.dataset.mode = mode;
    $("#modalKicker").textContent = isQuick ? "Швидка порада" : "Порада дня";

    if (isQuick) {
      const item = pickRandom(data.quickAdvice);
      $("#modalTitle").textContent = item.title;
      $("#modalBody").textContent = item.body;
    } else {
      $("#modalTitle").textContent = "Порада дня";
      $("#modalBody").textContent = pickRandom(data.dayTips);
    }

    backdrop.hidden = false;
    document.body.classList.add("modal-open");
    $("#modalCloseButton")?.focus();
  }

  function closeModal() {
    $("#modalBackdrop").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function initQuote() {
    const setQuote = () => {
      $("#randomQuote").textContent = pickRandom(data.quotes);
    };
    setQuote();
    $("#newQuoteButton")?.addEventListener("click", setQuote);
  }

  function init() {
    if (!data) {
      document.body.innerHTML = "<main class='section'><div class='section-inner'><h1>Дані сайту не завантажилися</h1></div></main>";
      return;
    }

    initTheme();
    initNavigation();
    initScrollProgress();
    initRevealAnimations();
    initStats();
    initSituationTest();
    initPhrases();
    initNotToDo();
    initFiveMinutePlan();
    initBreathing();
    initEmotionSupport();
    initChecklist();
    initHelpSignals();
    initLibrary();
    initFaq();
    initModal();
    initQuote();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
