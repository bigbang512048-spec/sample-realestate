/*
 * K-Life 共通スクリプト
 * ハンバーガーメニュー／物件カード描画／検索・絞り込み／物件詳細描画／お問い合わせフォーム(mailto)
 */

/* -------------------------------------------------------------------------
 * ユーティリティ
 * ---------------------------------------------------------------------- */

function formatMan(man) {
  if (man === null || man === undefined) return "-";
  return man.toLocaleString("ja-JP") + "万円";
}

function typeLabel(type) {
  return PROPERTY_TYPES[type] || type;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* -------------------------------------------------------------------------
 * ヘッダー：ハンバーガーメニュー
 * ---------------------------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* -------------------------------------------------------------------------
 * 物件カード描画
 * ---------------------------------------------------------------------- */

function getFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem("klife_favorites") || "[]"));
  } catch (e) {
    return new Set();
  }
}

function propertyCardHTML(p) {
  const tagLabel = p.isNew ? "新着" : typeLabel(p.type);
  const tagClass = p.isNew ? "property-tag is-new" : "property-tag";
  const sizeText = p.size ? `${p.size}m²` : p.landSize ? `${p.landSize}m²(土地)` : "-";
  const isFavorite = getFavorites().has(p.id);

  return `
    <article class="property-card reveal">
      <a href="property-detail.html?id=${p.id}" class="property-photo">
        <span class="${tagClass}">${tagLabel}</span>
        <img src="${p.image}" alt="${p.title}" loading="lazy" width="400" height="300">
      </a>
      <button type="button" class="favorite-btn${isFavorite ? " is-active" : ""}" data-favorite-id="${p.id}" aria-label="お気に入りに追加">
        <svg viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>
      </button>
      <div class="property-body">
        <p class="property-price">${formatMan(p.price)}<small>（税込目安）</small></p>
        <h3 class="property-title">${p.title}</h3>
        <p class="property-location">${p.address}</p>
        <div class="property-specs">
          <span><strong>${p.layout}</strong> 間取り</span>
          <span><strong>${sizeText}</strong></span>
          <span><strong>${p.age}</strong></span>
        </div>
        <div class="property-more">
          <a href="property-detail.html?id=${p.id}" class="btn btn-dark btn-sm">詳細を見る</a>
        </div>
      </div>
    </article>
  `;
}

function renderGrid(containerId, list) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">条件に一致する物件が見つかりませんでした。<br>条件を変えて再度お試しください。</div>`;
    return;
  }
  el.innerHTML = list.map(propertyCardHTML).join("");
}

/* -------------------------------------------------------------------------
 * 物件カード：お気に入りトグル
 * ---------------------------------------------------------------------- */

function initFavorites() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".favorite-btn");
    if (!btn) return;
    e.preventDefault();

    const id = Number(btn.dataset.favoriteId);
    const favorites = getFavorites();
    const isActive = favorites.has(id);

    if (isActive) {
      favorites.delete(id);
    } else {
      favorites.add(id);
    }
    localStorage.setItem("klife_favorites", JSON.stringify([...favorites]));

    btn.classList.toggle("is-active", !isActive);
    const svgPath = btn.querySelector("svg");
    if (svgPath) svgPath.setAttribute("fill", !isActive ? "currentColor" : "none");
  });
}

/* -------------------------------------------------------------------------
 * おすすめ物件カルーセル
 * ---------------------------------------------------------------------- */

function initCarousel() {
  document.querySelectorAll(".carousel-wrap").forEach((wrap) => {
    const track = wrap.querySelector(".carousel-track");
    const prevBtn = wrap.querySelector("[data-carousel-prev]");
    const nextBtn = wrap.querySelector("[data-carousel-next]");
    if (!track) return;

    const scrollByCard = (direction) => {
      const card = track.querySelector(".property-card");
      const amount = card ? card.getBoundingClientRect().width + 26 : track.clientWidth * 0.8;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
    };

    if (prevBtn) prevBtn.addEventListener("click", () => scrollByCard(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollByCard(1));
  });
}

/* -------------------------------------------------------------------------
 * トップページ：ヒーロー掲載件数バッジ
 * ---------------------------------------------------------------------- */

function initHeroStat() {
  const countEl = document.getElementById("heroPropertyCount");
  if (!countEl) return;
  countEl.textContent = PROPERTIES.length.toLocaleString("ja-JP");

  const dateEl = document.getElementById("heroStatDate");
  if (dateEl) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    dateEl.textContent = `${y}.${m}.${d} 更新`;
  }
}

/* -------------------------------------------------------------------------
 * トップページ：おすすめ物件
 * ---------------------------------------------------------------------- */

function initFeaturedProperties() {
  const el = document.getElementById("featuredGrid");
  if (!el) return;
  renderGrid("featuredGrid", PROPERTIES.slice(0, 4));
}

/* -------------------------------------------------------------------------
 * トップページ：検索パネル → properties.html へ遷移
 * ---------------------------------------------------------------------- */

function initHomeSearch() {
  const form = document.getElementById("homeSearchForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    const query = [...params.entries()]
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    window.location.href = "properties.html" + (query ? `?${query}` : "");
  });

  form.querySelectorAll("[data-type-link]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `properties.html?type=${link.dataset.typeLink}`;
    });
  });
}

/* -------------------------------------------------------------------------
 * 物件一覧ページ：絞り込み
 * ---------------------------------------------------------------------- */

function filterProperties({ area, price, type, feature }) {
  return PROPERTIES.filter((p) => {
    if (area && p.area !== area) return false;
    if (type && p.type !== type) return false;
    if (price && p.price > Number(price)) return false;
    if (feature) {
      const matchesFeature = p.features.some((f) => f.includes(feature));
      const matchesAge = p.age && p.age.includes(feature);
      if (!matchesFeature && !matchesAge) return false;
    }
    return true;
  });
}

function initPropertiesPage() {
  const form = document.getElementById("filterForm");
  const grid = document.getElementById("resultGrid");
  if (!form || !grid) return;

  function applyFromForm(pushHistory) {
    const data = new FormData(form);
    const filters = {
      area: data.get("area") || "",
      price: data.get("price") || "",
      type: data.get("type") || "",
      feature: data.get("feature") || "",
    };
    const result = filterProperties(filters);
    renderGrid("resultGrid", result);
    const countEl = document.getElementById("resultCount");
    if (countEl) countEl.textContent = String(result.length);

    if (pushHistory) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      const query = params.toString();
      history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    }
  }

  const initial = {
    area: getParam("area") || "",
    price: getParam("price") || "",
    type: getParam("type") || "",
    feature: getParam("feature") || "",
  };
  if (initial.area) form.elements["area"].value = initial.area;
  if (initial.price) form.elements["price"].value = initial.price;
  if (initial.type) form.elements["type"].value = initial.type;
  if (initial.feature && form.elements["feature"]) form.elements["feature"].value = initial.feature;

  applyFromForm(false);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFromForm(true);
  });

  form.addEventListener("reset", () => {
    setTimeout(() => applyFromForm(true), 0);
  });
}

/* -------------------------------------------------------------------------
 * 物件詳細ページ
 * ---------------------------------------------------------------------- */

function initPropertyDetail() {
  const root = document.getElementById("detailRoot");
  if (!root) return;

  const id = Number(getParam("id"));
  const p = PROPERTIES.find((item) => item.id === id) || PROPERTIES[0];

  document.title = `${p.title}｜K-Life（岡山県の不動産会社）`;

  const set = (selector, value) => {
    const el = root.querySelector(selector);
    if (el) el.textContent = value;
  };

  set("[data-field='title']", p.title);
  set("[data-field='price']", formatMan(p.price));
  set("[data-field='address']", p.address);
  set("[data-field='layout']", p.layout);
  set("[data-field='size']", p.size ? `${p.size}m²` : "-");
  set("[data-field='landSize']", p.landSize ? `${p.landSize}m²` : "-");
  set("[data-field='age']", p.age);
  set("[data-field='station']", p.station);
  set("[data-field='type']", typeLabel(p.type));
  set("[data-field='desc']", p.description);

  const photo = root.querySelector("[data-field='photo']");
  if (photo) {
    photo.src = p.image;
    photo.alt = p.title;
  }

  const thumbs = root.querySelector("[data-field='thumbs']");
  if (thumbs) {
    thumbs.innerHTML = Array(4)
      .fill(p.image)
      .map(
        (src) =>
          `<div class="thumb-item"><img src="${src}" alt="${p.title}" loading="lazy" width="200" height="150"></div>`
      )
      .join("");
  }

  const featureWrap = root.querySelector("[data-field='features']");
  if (featureWrap) {
    featureWrap.innerHTML = p.features.map((f) => `<span>${f}</span>`).join("");
  }

  root.querySelectorAll("[data-field='detail-link']").forEach((a) => {
    a.href = `property-detail.html?id=${p.id}`;
  });
}

/* -------------------------------------------------------------------------
 * スクロール連動フェードイン
 * ---------------------------------------------------------------------- */

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------------------------
 * お問い合わせフォーム（mailto方式）
 * ---------------------------------------------------------------------- */

function attachMailtoForm(formId, options) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const lines = [];
    form.querySelectorAll("[name]").forEach((field) => {
      const label = field.dataset.label || field.name;
      const value = data.get(field.name);
      if (value) lines.push(`${label}：${value}`);
    });

    const subject = encodeURIComponent(options.subject);
    const body = encodeURIComponent(lines.join("\n"));
    const mailto = `mailto:${options.to}?subject=${subject}&body=${body}`;

    const statusEl = document.getElementById(options.statusId);
    if (statusEl) {
      statusEl.textContent =
        "メールソフトが起動します。開かない場合はお電話またはLINEにてお問い合わせください。";
    }

    window.location.href = mailto;
  });
}

/* -------------------------------------------------------------------------
 * 初期化
 * ---------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initFavorites();
  initHeroStat();
  initFeaturedProperties();
  initCarousel();
  initHomeSearch();
  initPropertiesPage();
  initPropertyDetail();

  attachMailtoForm("contactForm", {
    to: "info@k-life-okayama.example.com",
    subject: "【K-Life】ホームページからのお問い合わせ",
    statusId: "contactFormStatus",
  });

  attachMailtoForm("assessmentForm", {
    to: "info@k-life-okayama.example.com",
    subject: "【K-Life】無料査定のお申し込み",
    statusId: "assessmentFormStatus",
  });

  initReveal();
});
