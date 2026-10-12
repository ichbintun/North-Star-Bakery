/* ==========================================================
   North Star Bakery - Interactivity
   1. Pre-order list builder with category filter (products.html)
   2. Pre-order form validation and pre-filling (contact.html)
   3. Browser storage with localStorage (both pages)
   ========================================================== */

/* ---------- Data ---------- */

// Keys used to save data in localStorage.
const STORAGE_KEYS = {
  preorderList: "northStar.preorderList",
  filter: "northStar.productFilter",
  customer: "northStar.customer"
};

// Product catalog. Each object matches a product card on products.html.
// "price" is the starting price used for the estimated total.
const PRODUCTS = [
  { id: "signature-loaf", name: "North Star Signature Loaf", category: "breads", price: 10, unit: "loaf" },
  { id: "honey-oat-loaf", name: "Honey Oat Harvest Loaf", category: "breads", price: 8, unit: "loaf" },
  { id: "seeded-multigrain", name: "Seeded Multigrain", category: "breads", price: 9, unit: "loaf" },
  { id: "classic-baguette", name: "Classic Baguette", category: "breads", price: 6, unit: "baguette" },
  { id: "butter-croissant", name: "Butter Croissant", category: "pastries", price: 4, unit: "croissant" },
  { id: "cinnamon-roll", name: "Cinnamon Morning Roll", category: "pastries", price: 5, unit: "roll" },
  { id: "fruit-scone", name: "Seasonal Fruit Scone", category: "pastries", price: 3.5, unit: "scone" },
  { id: "breakfast-box", name: "Commuter Breakfast Box", category: "pastries", price: 6, unit: "box" },
  { id: "layer-cake", name: "Celebration Layer Cake", category: "cakes", price: 45, unit: "cake" },
  { id: "sheet-cake", name: "Family Sheet Cake", category: "cakes", price: 55, unit: "cake" },
  { id: "event-cake", name: "Custom Event Cake", category: "cakes", price: 120, unit: "cake" },
  { id: "mini-cake", name: "Mini Cake for Two", category: "cakes", price: 30, unit: "cake" }
];

// Labels shown in the filter status message.
const CATEGORY_LABELS = {
  all: "all products",
  breads: "breads",
  pastries: "pastries",
  cakes: "cakes"
};

const MAX_QUANTITY = 24;

// The user's current list: an array of { id, quantity } objects.
let preorderList = [];

/* ---------- Storage helpers ---------- */

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage can be blocked (for example in some private windows).
    // The page still works; the data just is not remembered.
    console.warn("Could not save to localStorage:", error);
  }
}

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch (error) {
    console.warn("Could not read from localStorage:", error);
    return fallback;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Could not remove from localStorage:", error);
  }
}

/* ---------- Pre-order list logic ---------- */

function findProduct(productId) {
  return PRODUCTS.find(function (product) {
    return product.id === productId;
  });
}

function loadPreorderList() {
  const saved = loadFromStorage(STORAGE_KEYS.preorderList, []);
  // Keep only valid entries in case the saved data is old or edited.
  if (!Array.isArray(saved)) {
    return [];
  }
  return saved.filter(function (item) {
    return findProduct(item.id) && Number(item.quantity) > 0;
  }).map(function (item) {
    return { id: item.id, quantity: Math.min(Number(item.quantity), MAX_QUANTITY) };
  });
}

function savePreorderList() {
  saveToStorage(STORAGE_KEYS.preorderList, preorderList);
}

function addToList(productId) {
  const existing = preorderList.find(function (item) {
    return item.id === productId;
  });
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, MAX_QUANTITY);
  } else {
    preorderList.push({ id: productId, quantity: 1 });
  }
  savePreorderList();
  renderPreorderList();
  announce(findProduct(productId).name + " added to your pre-order list.");
}

function changeQuantity(productId, amount) {
  const item = preorderList.find(function (entry) {
    return entry.id === productId;
  });
  if (!item) {
    return;
  }
  item.quantity = item.quantity + amount;
  if (item.quantity <= 0) {
    removeFromList(productId);
    return;
  }
  item.quantity = Math.min(item.quantity, MAX_QUANTITY);
  savePreorderList();
  renderPreorderList();
}

function removeFromList(productId) {
  const product = findProduct(productId);
  preorderList = preorderList.filter(function (item) {
    return item.id !== productId;
  });
  savePreorderList();
  renderPreorderList();
  announce(product.name + " removed from your pre-order list.");
}

function clearList() {
  preorderList = [];
  removeFromStorage(STORAGE_KEYS.preorderList);
  renderPreorderList();
  announce("Your pre-order list has been cleared.");
}

function countItems(list) {
  return list.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
}

function calculateTotal(list) {
  return list.reduce(function (total, item) {
    return total + findProduct(item.id).price * item.quantity;
  }, 0);
}

function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}

// Turns the list into text such as "2 x Butter Croissant".
function listToText(list) {
  return list.map(function (item) {
    return item.quantity + " x " + findProduct(item.id).name;
  }).join("\n");
}

/* ---------- Pre-order list display (products.html) ---------- */

function createQuantityButton(label, ariaLabel, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "qty-button";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

function createListItem(item) {
  const product = findProduct(item.id);
  const li = document.createElement("li");
  li.className = "preorder-item";

  const name = document.createElement("span");
  name.className = "preorder-name";
  name.textContent = product.name;

  const controls = document.createElement("span");
  controls.className = "qty-controls";

  const quantity = document.createElement("span");
  quantity.className = "qty-value";
  quantity.textContent = item.quantity;
  quantity.setAttribute("aria-label", "Quantity " + item.quantity);

  controls.append(
    createQuantityButton("−", "Remove one " + product.name, function () {
      changeQuantity(item.id, -1);
    }),
    quantity,
    createQuantityButton("+", "Add one more " + product.name, function () {
      changeQuantity(item.id, 1);
    })
  );

  const subtotal = document.createElement("span");
  subtotal.className = "preorder-subtotal";
  subtotal.textContent = formatPrice(product.price * item.quantity);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-button";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove " + product.name + " from list");
  remove.addEventListener("click", function () {
    removeFromList(item.id);
  });

  li.append(name, controls, subtotal, remove);
  return li;
}

function renderPreorderList() {
  const listElement = document.getElementById("preorder-items");
  if (!listElement) {
    return;
  }
  const emptyMessage = document.getElementById("preorder-empty");
  const totalElement = document.getElementById("preorder-total");
  const actions = document.getElementById("preorder-actions");
  const countBadge = document.getElementById("preorder-count");

  listElement.innerHTML = "";
  preorderList.forEach(function (item) {
    listElement.appendChild(createListItem(item));
  });

  const itemCount = countItems(preorderList);
  const hasItems = itemCount > 0;
  countBadge.textContent = itemCount + (itemCount === 1 ? " item" : " items");
  emptyMessage.hidden = hasItems;
  totalElement.hidden = !hasItems;
  actions.hidden = !hasItems;
  totalElement.textContent = "Estimated starting total: " + formatPrice(calculateTotal(preorderList)) +
    " (final price is confirmed by email and paid at pickup)";

  updateAddButtons();
}

// Shows "In list (2)" on the product cards that are already in the list.
function updateAddButtons() {
  document.querySelectorAll(".add-button").forEach(function (button) {
    const productId = button.dataset.productId;
    const item = preorderList.find(function (entry) {
      return entry.id === productId;
    });
    const card = button.closest(".product-card");
    if (item) {
      button.textContent = "Add another (" + item.quantity + " in list)";
      card.classList.add("in-list");
    } else {
      button.textContent = "Add to pre-order";
      card.classList.remove("in-list");
    }
  });
}

function announce(message) {
  const live = document.getElementById("preorder-message");
  if (live) {
    live.textContent = message;
  }
}

/* ---------- Category filter (products.html) ---------- */

function applyFilter(category) {
  if (!CATEGORY_LABELS[category]) {
    category = "all";
  }
  document.querySelectorAll(".product-category").forEach(function (section) {
    section.hidden = category !== "all" && section.dataset.category !== category;
  });
  document.querySelectorAll(".filter-button").forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === category));
  });
  const status = document.getElementById("filter-status");
  if (status) {
    status.textContent = "Showing " + CATEGORY_LABELS[category] + ".";
  }
  saveToStorage(STORAGE_KEYS.filter, category);
}

function initProductsPage() {
  if (!document.getElementById("preorder-panel")) {
    return;
  }
  document.querySelectorAll(".add-button").forEach(function (button) {
    button.addEventListener("click", function () {
      addToList(button.dataset.productId);
    });
  });
  document.querySelectorAll(".filter-button").forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.dataset.filter);
    });
  });
  document.getElementById("clear-list").addEventListener("click", clearList);

  applyFilter(loadFromStorage(STORAGE_KEYS.filter, "all"));
  renderPreorderList();
}

/* ---------- Form validation (contact.html) ---------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

// Reads a "YYYY-MM-DD" value as a local date (not UTC).
function parseLocalDate(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(fromDate, toDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((toDate - fromDate) / msPerDay);
}

function getSelectedRequestType(form) {
  const checked = form.querySelector('input[name="request-type"]:checked');
  return checked ? checked.value : "";
}

// Each rule checks one field and returns an error message, or "" if valid.
const VALIDATION_RULES = [
  {
    fieldId: "customer-name",
    check: function (value) {
      if (value === "") {
        return "Please enter your full name.";
      }
      if (value.length < 2) {
        return "Your name must be at least 2 characters long.";
      }
      return "";
    }
  },
  {
    fieldId: "customer-email",
    check: function (value) {
      if (value === "") {
        return "Please enter your email address so we can confirm your order.";
      }
      if (!EMAIL_PATTERN.test(value)) {
        return "Please enter a valid email address, such as name@example.com.";
      }
      return "";
    }
  },
  {
    fieldId: "customer-phone",
    check: function (value) {
      if (value !== "" && !PHONE_PATTERN.test(value)) {
        return "Please use the format 555-555-0142, or leave this field blank.";
      }
      return "";
    }
  },
  {
    fieldId: "request-type",
    groupName: "request-type",
    check: function (value) {
      return value === "" ? "Please choose a request type." : "";
    }
  },
  {
    fieldId: "pickup-date",
    check: function (value, form) {
      if (value === "") {
        return "Please choose a pickup date.";
      }
      const pickup = parseLocalDate(value);
      const daysAhead = daysBetween(getToday(), pickup);
      if (daysAhead < 0) {
        return "The pickup date cannot be in the past.";
      }
      if (pickup.getDay() === 1) {
        return "We are closed on Mondays. Please choose another day.";
      }
      if (getSelectedRequestType(form) === "event-order" && daysAhead < 14) {
        return "Custom and event cakes need at least two weeks of notice.";
      }
      return "";
    }
  },
  {
    fieldId: "item-details",
    check: function (value) {
      if (value === "") {
        return "Please tell us which items you would like or what your question is.";
      }
      if (value.length < 10) {
        return "Please add a little more detail (at least 10 characters).";
      }
      if (value.length > 500) {
        return "Please keep item details under 500 characters.";
      }
      return "";
    }
  }
];

function getFieldValue(form, rule) {
  if (rule.groupName) {
    return getSelectedRequestType(form);
  }
  return form.querySelector("#" + rule.fieldId).value.trim();
}

function getFieldElements(form, rule) {
  if (rule.groupName) {
    return Array.from(form.querySelectorAll('input[name="' + rule.groupName + '"]'));
  }
  return [form.querySelector("#" + rule.fieldId)];
}

function showFieldError(form, rule, message) {
  const errorElement = document.getElementById(rule.fieldId + "-error");
  errorElement.textContent = message;
  getFieldElements(form, rule).forEach(function (field) {
    if (message) {
      field.setAttribute("aria-invalid", "true");
      addDescribedBy(field, errorElement.id);
    } else {
      field.removeAttribute("aria-invalid");
    }
  });
}

function addDescribedBy(field, id) {
  const current = (field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
  if (current.indexOf(id) === -1) {
    current.push(id);
    field.setAttribute("aria-describedby", current.join(" "));
  }
}

function validateRule(form, rule) {
  const message = rule.check(getFieldValue(form, rule), form);
  showFieldError(form, rule, message);
  return message;
}

function validateForm(form) {
  const errors = [];
  VALIDATION_RULES.forEach(function (rule) {
    const message = validateRule(form, rule);
    if (message) {
      errors.push({ rule: rule, message: message });
    }
  });
  return errors;
}

function showSummary(errors) {
  const summary = document.getElementById("form-summary");
  if (errors.length === 0) {
    summary.hidden = true;
    summary.textContent = "";
    return;
  }
  summary.textContent = "Please fix " + errors.length +
    (errors.length === 1 ? " field" : " fields") +
    " marked below. Everything you have already entered has been kept.";
  summary.hidden = false;
}

function focusFirstError(form, errors) {
  const firstField = getFieldElements(form, errors[0].rule)[0];
  firstField.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const success = document.getElementById("form-success");
  success.hidden = true;

  const errors = validateForm(form);
  showSummary(errors);

  if (errors.length > 0) {
    focusFirstError(form, errors);
    return;
  }

  rememberCustomer(form);
  showSuccess(form);
}

function showSuccess(form) {
  const name = form.querySelector("#customer-name").value.trim();
  const email = form.querySelector("#customer-email").value.trim();
  const date = parseLocalDate(form.querySelector("#pickup-date").value);
  const success = document.getElementById("form-success");

  success.textContent = "Thank you, " + name + "! Your request for pickup on " +
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) +
    " has been received. We will email " + email + " within one business day.";
  success.hidden = false;
  success.focus();

  // The request has been sent, so the saved list is no longer needed.
  preorderList = [];
  removeFromStorage(STORAGE_KEYS.preorderList);
  form.reset();
  prefillCustomer(form);
  hideNotice();
}

// Re-checks a field as the user corrects it, but only after it has shown an error,
// so people are not interrupted while typing for the first time.
function attachLiveValidation(form) {
  VALIDATION_RULES.forEach(function (rule) {
    getFieldElements(form, rule).forEach(function (field) {
      const eventName = field.type === "radio" || field.type === "date" || field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(eventName, function () {
        if (document.getElementById(rule.fieldId + "-error").textContent !== "") {
          validateRule(form, rule);
        }
      });
    });
  });

  // Changing the request type can change whether the pickup date is valid.
  form.querySelectorAll('input[name="request-type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (document.getElementById("pickup-date-error").textContent !== "") {
        validateRule(form, VALIDATION_RULES.find(function (rule) {
          return rule.fieldId === "pickup-date";
        }));
      }
    });
  });
}

/* ---------- Remembered details and pre-filling (contact.html) ---------- */

function rememberCustomer(form) {
  if (form.querySelector("#remember-me").checked) {
    saveToStorage(STORAGE_KEYS.customer, {
      name: form.querySelector("#customer-name").value.trim(),
      email: form.querySelector("#customer-email").value.trim()
    });
  } else {
    removeFromStorage(STORAGE_KEYS.customer);
  }
}

function prefillCustomer(form) {
  const customer = loadFromStorage(STORAGE_KEYS.customer, null);
  if (customer && customer.name) {
    form.querySelector("#customer-name").value = customer.name;
    form.querySelector("#customer-email").value = customer.email || "";
    return true;
  }
  return false;
}

function prefillFromList(form) {
  if (preorderList.length === 0) {
    return false;
  }
  const details = form.querySelector("#item-details");
  // Only fill an empty box so we never overwrite what the user typed.
  if (details.value.trim() === "") {
    details.value = listToText(preorderList);
  }
  form.querySelector("#type-preorder").checked = true;

  const categories = preorderList.map(function (item) {
    return findProduct(item.id).category;
  }).filter(function (category, index, all) {
    return all.indexOf(category) === index;
  });
  form.querySelector("#product-category").value = categories.length === 1 ? categories[0] : "mixed";
  return true;
}

function showNotice(filledList, filledCustomer) {
  const notice = document.getElementById("prefill-notice");
  const parts = [];
  if (filledList) {
    parts.push("the " + countItems(preorderList) + " items from your pre-order list");
  }
  if (filledCustomer) {
    parts.push("your saved name and email");
  }
  if (parts.length === 0) {
    return;
  }
  notice.textContent = "We filled in " + parts.join(" and ") + ". You can edit anything before sending.";
  notice.hidden = false;
}

function hideNotice() {
  document.getElementById("prefill-notice").hidden = true;
}

function initContactPage() {
  const form = document.getElementById("preorder-form");
  if (!form) {
    return;
  }
  const filledCustomer = prefillCustomer(form);
  const filledList = prefillFromList(form);
  showNotice(filledList, filledCustomer);

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", function () {
    VALIDATION_RULES.forEach(function (rule) {
      showFieldError(form, rule, "");
    });
    showSummary([]);
  });
  attachLiveValidation(form);
}

/* ---------- Start ---------- */

function init() {
  preorderList = loadPreorderList();
  initProductsPage();
  initContactPage();
}

document.addEventListener("DOMContentLoaded", init);
