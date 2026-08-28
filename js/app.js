import { supabase } from "./supabase-init.js";

const categoryNav = document.getElementById("category-nav");
const menuMain = document.getElementById("menu-main");

const state = {
  categories: [],
  itemsByCategory: new Map(),
};

/* ---------------------------------------------------------------------- */
/* Rendering helpers                                                       */
/* ---------------------------------------------------------------------- */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatPrice(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "£—";
  return `£${num.toFixed(2)}`;
}

function renderSkeleton() {
  menuMain.innerHTML = "";
  for (let s = 0; s < 3; s++) {
    const section = document.createElement("div");
    section.className = "menu-section";
    section.innerHTML = `
      <div class="skeleton skeleton-line w-40" style="height:22px; width:180px; margin-bottom:20px;"></div>
      <div class="menu-grid">
        ${Array.from({ length: 4 })
          .map(
            () => `
          <div class="skeleton-card">
            <div class="skeleton skeleton-thumb"></div>
            <div class="skeleton-lines">
              <div class="skeleton skeleton-line w-60"></div>
              <div class="skeleton skeleton-line w-40"></div>
            </div>
          </div>`
          )
          .join("")}
      </div>`;
    menuMain.appendChild(section);
  }
}

function renderCategoryNav() {
  categoryNav.innerHTML = "";
  if (state.categories.length === 0) return;

  state.categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = "category-pill";
    btn.dataset.categoryId = cat.id;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", index === 0 ? "true" : "false");
    if (index === 0) btn.classList.add("is-active");

    const imgHtml = cat.logo_url
      ? `<img class="category-pill-img" src="${escapeHtml(cat.logo_url)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'category-pill-img-fallback\\'>${escapeHtml(
          (cat.name || "?").slice(0, 2).toUpperCase()
        )}</div>'" />`
      : `<div class="category-pill-img-fallback">${escapeHtml(
          (cat.name || "?").slice(0, 2).toUpperCase()
        )}</div>`;

    btn.innerHTML = `
      ${imgHtml}
      <span class="category-pill-label">${escapeHtml(cat.name)}</span>
    `;

    btn.addEventListener("click", () => {
      const target = document.getElementById(`category-${cat.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    categoryNav.appendChild(btn);
  });
}

function itemCardHtml(item) {
  const imgHtml = item.image_url
    ? `<img class="menu-item-img" src="${escapeHtml(item.image_url)}" alt="" loading="lazy"
         onerror="this.outerHTML='<div class=\\'menu-item-img-fallback\\'>No photo</div>'" />`
    : `<div class="menu-item-img-fallback">No photo</div>`;

  return `
    <article class="menu-item-card">
      ${imgHtml}
      <div class="menu-item-body">
        <div class="menu-item-top">
          <span class="menu-item-name">${escapeHtml(item.name)}</span>
          <span class="menu-item-price">${formatPrice(item.price)}</span>
        </div>
        ${item.description ? `<p class="menu-item-desc">${escapeHtml(item.description)}</p>` : ""}
      </div>
    </article>
  `;
}

function renderMenuSections() {
  menuMain.innerHTML = "";

  if (state.categories.length === 0) {
    menuMain.innerHTML = `
      <div class="state-block">
        <h3>The menu is being freshened up</h3>
        <p>Please check back shortly.</p>
      </div>`;
    return;
  }

  state.categories.forEach((cat) => {
    const items = state.itemsByCategory.get(cat.id) || [];
    const section = document.createElement("section");
    section.className = "menu-section";
    section.id = `category-${cat.id}`;

    section.innerHTML = `
      <h2 class="menu-section-title">${escapeHtml(cat.name)}</h2>
      <div class="menu-section-divider"></div>
      <div class="menu-grid">
        ${
          items.length
            ? items.map(itemCardHtml).join("")
            : `<p style="color:var(--ink-soft); font-size:14px;">No items in this category yet.</p>`
        }
      </div>
    `;
    menuMain.appendChild(section);
  });

  setupScrollSpy();
}

/* ---------------------------------------------------------------------- */
/* Scroll spy — highlights the active category pill as the user scrolls    */
/* ---------------------------------------------------------------------- */

function setupScrollSpy() {
  const sections = state.categories
    .map((cat) => document.getElementById(`category-${cat.id}`))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id.replace("category-", "");
        document.querySelectorAll(".category-pill").forEach((pill) => {
          const isActive = pill.dataset.categoryId === id;
          pill.classList.toggle("is-active", isActive);
          pill.setAttribute("aria-selected", isActive ? "true" : "false");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------------------- */
/* Data loading                                                            */
/* ---------------------------------------------------------------------- */

async function loadMenu() {
  renderSkeleton();
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });

    if (categoriesError) throw categoriesError;
    state.categories = categories || [];

    const { data: items, error: itemsError } = await supabase.from("items").select("*");
    if (itemsError) throw itemsError;

    state.itemsByCategory = new Map();
    (items || []).forEach((item) => {
      const list = state.itemsByCategory.get(item.category_id) || [];
      list.push(item);
      state.itemsByCategory.set(item.category_id, list);
    });
    // Keep items in a stable, readable order within each category
    state.itemsByCategory.forEach((list) =>
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    );

    renderCategoryNav();
    renderMenuSections();
  } catch (err) {
    console.error("Failed to load menu:", err);
    menuMain.innerHTML = `
      <div class="state-block">
        <h3>Couldn't load the menu</h3>
        <p>Please check your connection and try refreshing the page.</p>
      </div>`;
  }
}

loadMenu();
