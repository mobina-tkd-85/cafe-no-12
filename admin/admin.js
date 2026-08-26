import {
  db,
  storage,
  auth,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "../js/firebase-init.js";

/* ---------------------------------------------------------------------- */
/* Element refs                                                            */
/* ---------------------------------------------------------------------- */

const loginWrap = document.getElementById("login-wrap");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const adminEmailLabel = document.getElementById("admin-email-label");

const categoryForm = document.getElementById("category-form");
const categoryList = document.getElementById("category-list");
const categoryLogoInput = document.getElementById("category-logo-input");
const categoryLogoPreview = document.getElementById("category-logo-preview");
const categorySubmitBtn = document.getElementById("category-submit-btn");
const categoryFormError = document.getElementById("category-form-error");
const categoryUploadProgress = document.getElementById("category-upload-progress");

const itemForm = document.getElementById("item-form");
const itemList = document.getElementById("item-list");
const itemCategorySelect = document.getElementById("item-category-select");
const itemImageInput = document.getElementById("item-image-input");
const itemImagePreview = document.getElementById("item-image-preview");
const itemSubmitBtn = document.getElementById("item-submit-btn");
const itemFormError = document.getElementById("item-form-error");
const itemUploadProgress = document.getElementById("item-upload-progress");

const toast = document.getElementById("toast");

let state = {
  categories: [],
  items: [],
};

let pendingCategoryFile = null;
let pendingItemFile = null;

/* ---------------------------------------------------------------------- */
/* Utilities                                                                */
/* ---------------------------------------------------------------------- */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

let toastTimer = null;
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setButtonLoading(btn, isLoading, loadingLabel, defaultLabel) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? loadingLabel : defaultLabel;
}

/** Uploads a file to Storage with a progress callback, returns the download URL. */
function uploadImage(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(pct);
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

function validateImageFile(file) {
  if (!file) return null;
  const okTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!okTypes.includes(file.type)) {
    return "Please choose a PNG, JPG, WEBP, or GIF image.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Image is too large — please choose a file under 5MB.";
  }
  return null;
}

/* ---------------------------------------------------------------------- */
/* Auth                                                                     */
/* ---------------------------------------------------------------------- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginWrap.hidden = true;
    dashboard.hidden = false;
    adminEmailLabel.textContent = user.email || "";
    loadAll();
  } else {
    loginWrap.hidden = false;
    dashboard.hidden = true;
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  setButtonLoading(submitBtn, true, "Signing in…", "Sign in");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    loginError.textContent = "Couldn't sign in. Check the email and password and try again.";
  } finally {
    setButtonLoading(submitBtn, false, "Signing in…", "Sign in");
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

/* ---------------------------------------------------------------------- */
/* Load categories + items                                                 */
/* ---------------------------------------------------------------------- */

async function loadAll() {
  try {
    const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"));
    const categoriesSnap = await getDocs(categoriesQuery);
    state.categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const itemsSnap = await getDocs(collection(db, "items"));
    state.items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderCategoryList();
    renderCategorySelect();
    renderItemList();
  } catch (err) {
    console.error(err);
    showToast("Couldn't load menu data. Please refresh.", true);
  }
}

/* ---------------------------------------------------------------------- */
/* Category management                                                     */
/* ---------------------------------------------------------------------- */

categoryLogoInput.addEventListener("change", () => {
  const file = categoryLogoInput.files[0];
  categoryFormError.textContent = "";
  if (!file) {
    pendingCategoryFile = null;
    categoryLogoPreview.hidden = true;
    return;
  }
  const err = validateImageFile(file);
  if (err) {
    categoryFormError.textContent = err;
    categoryLogoInput.value = "";
    pendingCategoryFile = null;
    return;
  }
  pendingCategoryFile = file;
  categoryLogoPreview.src = URL.createObjectURL(file);
  categoryLogoPreview.hidden = false;
});

categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  categoryFormError.textContent = "";
  const name = document.getElementById("category-name-input").value.trim();

  if (!name) {
    categoryFormError.textContent = "Please enter a category name.";
    return;
  }

  setButtonLoading(categorySubmitBtn, true, "Adding…", "Add category");
  categoryUploadProgress.style.display = "none";

  try {
    let logoUrl = "";
    if (pendingCategoryFile) {
      categoryUploadProgress.style.display = "block";
      const path = `category-logos/${Date.now()}-${pendingCategoryFile.name}`;
      logoUrl = await uploadImage(pendingCategoryFile, path, (pct) => {
        categoryUploadProgress.querySelector(".progress-bar-fill").style.width = `${pct}%`;
      });
    }

    await addDoc(collection(db, "categories"), {
      name,
      logoUrl,
      order: state.categories.length,
      createdAt: serverTimestamp(),
    });

    categoryForm.reset();
    categoryLogoPreview.hidden = true;
    pendingCategoryFile = null;
    showToast("Category added.");
    await loadAll();
  } catch (err) {
    console.error(err);
    categoryFormError.textContent = "Something went wrong uploading or saving. Please try again.";
    showToast("Couldn't add category.", true);
  } finally {
    setButtonLoading(categorySubmitBtn, false, "Adding…", "Add category");
    categoryUploadProgress.style.display = "none";
    categoryUploadProgress.querySelector(".progress-bar-fill").style.width = "0%";
  }
});

function renderCategoryList() {
  if (state.categories.length === 0) {
    categoryList.innerHTML = `<p style="color:var(--ink-soft); font-size:14px;">No categories yet — add your first one above.</p>`;
    return;
  }

  categoryList.innerHTML = state.categories
    .map((cat) => {
      const itemCount = state.items.filter((i) => i.categoryId === cat.id).length;
      const imgHtml = cat.logoUrl
        ? `<img src="${escapeHtml(cat.logoUrl)}" alt="" onerror="this.outerHTML='<div class=\\'img-fallback\\'>—</div>'" />`
        : `<div class="img-fallback">—</div>`;
      return `
        <div class="admin-row" data-id="${cat.id}">
          ${imgHtml}
          <div class="row-body">
            <div class="row-title">${escapeHtml(cat.name)}</div>
            <div class="row-meta">${itemCount} item${itemCount === 1 ? "" : "s"}</div>
          </div>
          <div class="row-actions">
            <button class="icon-btn danger" title="Delete category" data-action="delete-category" data-id="${cat.id}">✕</button>
          </div>
        </div>`;
    })
    .join("");
}

categoryList.addEventListener("click", async (e) => {
  const btn = e.target.closest('[data-action="delete-category"]');
  if (!btn) return;
  const id = btn.dataset.id;
  const cat = state.categories.find((c) => c.id === id);
  const itemCount = state.items.filter((i) => i.categoryId === id).length;

  const confirmMsg = itemCount
    ? `Delete "${cat?.name}" and its ${itemCount} item${itemCount === 1 ? "" : "s"}? This can't be undone.`
    : `Delete "${cat?.name}"? This can't be undone.`;
  if (!window.confirm(confirmMsg)) return;

  btn.disabled = true;
  try {
    // Delete items in this category first (and their images), then the category.
    const itemsToDelete = state.items.filter((i) => i.categoryId === id);
    for (const item of itemsToDelete) {
      await deleteItemRecord(item);
    }
    if (cat?.logoUrl) {
      await deleteImageSafely(cat.logoUrl);
    }
    await deleteDoc(doc(db, "categories", id));
    showToast("Category deleted.");
    await loadAll();
  } catch (err) {
    console.error(err);
    showToast("Couldn't delete category.", true);
  } finally {
    btn.disabled = false;
  }
});

/* ---------------------------------------------------------------------- */
/* Item management                                                         */
/* ---------------------------------------------------------------------- */

function renderCategorySelect() {
  if (state.categories.length === 0) {
    itemCategorySelect.innerHTML = `<option value="">Add a category first</option>`;
    itemCategorySelect.disabled = true;
    itemSubmitBtn.disabled = true;
    return;
  }
  itemCategorySelect.disabled = false;
  itemSubmitBtn.disabled = false;
  itemCategorySelect.innerHTML = state.categories
    .map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`)
    .join("");
}

itemImageInput.addEventListener("change", () => {
  const file = itemImageInput.files[0];
  itemFormError.textContent = "";
  if (!file) {
    pendingItemFile = null;
    itemImagePreview.hidden = true;
    return;
  }
  const err = validateImageFile(file);
  if (err) {
    itemFormError.textContent = err;
    itemImageInput.value = "";
    pendingItemFile = null;
    return;
  }
  pendingItemFile = file;
  itemImagePreview.src = URL.createObjectURL(file);
  itemImagePreview.hidden = false;
});

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  itemFormError.textContent = "";

  const name = document.getElementById("item-name-input").value.trim();
  const priceRaw = document.getElementById("item-price-input").value;
  const description = document.getElementById("item-description-input").value.trim();
  const categoryId = itemCategorySelect.value;
  const price = Number(priceRaw);

  if (!name || !categoryId || priceRaw === "" || Number.isNaN(price) || price < 0) {
    itemFormError.textContent = "Please enter a name, a valid price, and choose a category.";
    return;
  }

  setButtonLoading(itemSubmitBtn, true, "Adding…", "Add item");
  itemUploadProgress.style.display = "none";

  try {
    let imageUrl = "";
    if (pendingItemFile) {
      itemUploadProgress.style.display = "block";
      const path = `menu-items/${Date.now()}-${pendingItemFile.name}`;
      imageUrl = await uploadImage(pendingItemFile, path, (pct) => {
        itemUploadProgress.querySelector(".progress-bar-fill").style.width = `${pct}%`;
      });
    }

    await addDoc(collection(db, "items"), {
      name,
      price,
      description,
      imageUrl,
      categoryId,
      createdAt: serverTimestamp(),
    });

    itemForm.reset();
    itemImagePreview.hidden = true;
    pendingItemFile = null;
    showToast("Item added.");
    await loadAll();
  } catch (err) {
    console.error(err);
    itemFormError.textContent = "Something went wrong uploading or saving. Please try again.";
    showToast("Couldn't add item.", true);
  } finally {
    setButtonLoading(itemSubmitBtn, false, "Adding…", "Add item");
    itemUploadProgress.style.display = "none";
    itemUploadProgress.querySelector(".progress-bar-fill").style.width = "0%";
  }
});

function renderItemList() {
  if (state.items.length === 0) {
    itemList.innerHTML = `<p style="color:var(--ink-soft); font-size:14px;">No items yet — add your first one above.</p>`;
    return;
  }

  const byCategoryName = (item) =>
    state.categories.find((c) => c.id === item.categoryId)?.name || "Uncategorised";

  itemList.innerHTML = [...state.items]
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((item) => {
      const imgHtml = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="" onerror="this.outerHTML='<div class=\\'img-fallback\\'>—</div>'" />`
        : `<div class="img-fallback">—</div>`;
      return `
        <div class="admin-row" data-id="${item.id}">
          ${imgHtml}
          <div class="row-body">
            <div class="row-title">${escapeHtml(item.name)} — £${Number(item.price).toFixed(2)}</div>
            <div class="row-meta">${escapeHtml(byCategoryName(item))}${item.description ? " · " + escapeHtml(item.description) : ""}</div>
          </div>
          <div class="row-actions">
            <button class="icon-btn danger" title="Delete item" data-action="delete-item" data-id="${item.id}">✕</button>
          </div>
        </div>`;
    })
    .join("");
}

itemList.addEventListener("click", async (e) => {
  const btn = e.target.closest('[data-action="delete-item"]');
  if (!btn) return;
  const id = btn.dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!window.confirm(`Delete "${item?.name}"? This can't be undone.`)) return;

  btn.disabled = true;
  try {
    await deleteItemRecord(item);
    showToast("Item deleted.");
    await loadAll();
  } catch (err) {
    console.error(err);
    showToast("Couldn't delete item.", true);
  } finally {
    btn.disabled = false;
  }
});

async function deleteItemRecord(item) {
  if (item.imageUrl) {
    await deleteImageSafely(item.imageUrl);
  }
  await deleteDoc(doc(db, "items", item.id));
}

/** Deletes a Storage image but never blocks the calling flow if it's already gone. */
async function deleteImageSafely(url) {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Could not delete image (may already be removed):", err);
  }
}
