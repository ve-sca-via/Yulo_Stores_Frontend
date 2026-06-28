const params = new URLSearchParams(window.location.search);
const restaurantId = params.get("restaurantId");
const tableNumber = params.get("tableNumber");

const restaurantNameEl = document.getElementById("restaurantName");
const heroTextEl = document.getElementById("heroText");
const tableBadgeEl = document.getElementById("tableBadge");
const itemCountBadgeEl = document.getElementById("itemCountBadge");
const statusTextEl = document.getElementById("statusText");
const menuStateEl = document.getElementById("menuState");
const menuGridEl = document.getElementById("menuGrid");
const orderStatusEl = document.getElementById("orderStatus");
const emptyCartStateEl = document.getElementById("emptyCartState");
const selectedItemsEl = document.getElementById("selectedItems");
const orderTotalEl = document.getElementById("orderTotal");
const placeOrderButtonEl = document.getElementById("placeOrderButton");

let currentRestaurant = null;
const selectedQuantities = new Map();

const themes = [
  {
    bg: "linear-gradient(135deg, #f7f1e8 0%, #efe3d0 50%, #d7c3a7 100%)",
    surface: "rgba(255, 252, 247, 0.78)",
    surfaceStrong: "#fffaf2",
    text: "#2a2118",
    muted: "#6e5b48",
    accent: "#b85c38",
    accentSoft: "rgba(184, 92, 56, 0.12)",
    border: "rgba(63, 40, 19, 0.1)",
    shadow: "0 24px 70px rgba(62, 35, 10, 0.15)",
  },
  {
    bg: "linear-gradient(135deg, #eef6f2 0%, #d6eadf 55%, #a7ccb9 100%)",
    surface: "rgba(247, 255, 251, 0.8)",
    surfaceStrong: "#f9fffb",
    text: "#10241c",
    muted: "#476457",
    accent: "#1f7a5c",
    accentSoft: "rgba(31, 122, 92, 0.14)",
    border: "rgba(16, 36, 28, 0.1)",
    shadow: "0 24px 70px rgba(20, 73, 56, 0.14)",
  },
  {
    bg: "linear-gradient(135deg, #f4ede7 0%, #ead2be 50%, #cda27e 100%)",
    surface: "rgba(255, 249, 244, 0.78)",
    surfaceStrong: "#fffaf5",
    text: "#2f1c11",
    muted: "#76533d",
    accent: "#c06a2b",
    accentSoft: "rgba(192, 106, 43, 0.14)",
    border: "rgba(47, 28, 17, 0.1)",
    shadow: "0 24px 70px rgba(101, 52, 19, 0.14)",
  },
  {
    bg: "linear-gradient(135deg, #f1f2f8 0%, #d9def0 52%, #a9b4da 100%)",
    surface: "rgba(251, 252, 255, 0.78)",
    surfaceStrong: "#ffffff",
    text: "#182033",
    muted: "#596683",
    accent: "#3454d1",
    accentSoft: "rgba(52, 84, 209, 0.12)",
    border: "rgba(24, 32, 51, 0.1)",
    shadow: "0 24px 70px rgba(37, 59, 141, 0.15)",
  },
];

function hashString(input) {
  return Array.from(input).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
}

function setTheme(restaurant) {
  const key = `${restaurant?.id ?? ""}${restaurant?.name ?? ""}`;
  const theme = themes[hashString(key) % themes.length];

  Object.entries({
    "--bg": theme.bg,
    "--surface": theme.surface,
    "--surface-strong": theme.surfaceStrong,
    "--text": theme.text,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--border": theme.border,
    "--shadow": theme.shadow,
  }).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function setError(message) {
  restaurantNameEl.textContent = "Menu unavailable";
  heroTextEl.textContent = message;
  statusTextEl.textContent = "Unable to load menu";
  menuStateEl.textContent = message;
  menuGridEl.classList.add("hidden");
  orderStatusEl.textContent = "Ordering unavailable";
  placeOrderButtonEl.disabled = true;
}

function getRecipes() {
  return Array.isArray(currentRestaurant?.recipies)
    ? currentRestaurant.recipies
    : [];
}

function getSelectedItems() {
  return getRecipes()
    .map((item) => ({
      ...item,
      quantity: selectedQuantities.get(item.id) ?? 0,
    }))
    .filter((item) => item.quantity > 0);
}

function updateCart() {
  const selectedItems = getSelectedItems();
  const total = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  orderTotalEl.textContent = formatPrice(total);
  placeOrderButtonEl.disabled = selectedItems.length === 0;

  if (selectedItems.length === 0) {
    emptyCartStateEl.classList.remove("hidden");
    selectedItemsEl.classList.add("hidden");
    orderStatusEl.textContent = "Select dishes to continue";
    selectedItemsEl.innerHTML = "";
    return;
  }

  emptyCartStateEl.classList.add("hidden");
  selectedItemsEl.classList.remove("hidden");
  orderStatusEl.textContent = tableNumber
    ? `Ordering for table ${tableNumber}`
    : "Ready to place order";

  selectedItemsEl.innerHTML = selectedItems
    .map(
      (item) => `
        <article class="selected-item">
          <div>
            <h3>${item.title}</h3>
            <p>${item.quantity} x ${formatPrice(item.price)}</p>
          </div>
          <strong>${formatPrice(item.price * item.quantity)}</strong>
        </article>
      `,
    )
    .join("");
}

function updateQuantity(recipeId, nextQuantity) {
  if (nextQuantity <= 0) {
    selectedQuantities.delete(recipeId);
  } else {
    selectedQuantities.set(recipeId, nextQuantity);
  }

  const recipe = getRecipes().find((item) => item.id === recipeId);
  const quantityValueEl = document.querySelector(
    `[data-quantity-for="${recipeId}"]`,
  );

  if (quantityValueEl) {
    quantityValueEl.textContent = selectedQuantities.get(recipeId) ?? 0;
  }

  if (recipe) {
    updateCart();
  }
}

function bindQuantityControls() {
  menuGridEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const recipeId = button.dataset.recipeId;
      const action = button.dataset.action;
      const currentQuantity = selectedQuantities.get(recipeId) ?? 0;

      updateQuantity(
        recipeId,
        action === "increase" ? currentQuantity + 1 : currentQuantity - 1,
      );
    });
  });
}

function renderRestaurant(restaurant) {
  currentRestaurant = restaurant;
  setTheme(restaurant);

  const recipes = getRecipes();

  restaurantNameEl.textContent = restaurant.name;
  heroTextEl.textContent = `${recipes.length} handpicked dishes currently listed for this restaurant.`;
  statusTextEl.textContent = "Freshly loaded from the restaurant record";
  itemCountBadgeEl.textContent = `${recipes.length} item${recipes.length === 1 ? "" : "s"}`;

  if (tableNumber) {
    tableBadgeEl.textContent = `Table ${tableNumber}`;
    tableBadgeEl.classList.remove("hidden");
  }

  if (recipes.length === 0) {
    menuStateEl.textContent = "No dishes added yet for this restaurant.";
    menuGridEl.classList.add("hidden");
    updateCart();
    return;
  }

  menuStateEl.classList.add("hidden");
  menuGridEl.classList.remove("hidden");
  menuGridEl.innerHTML = recipes
    .map((item, index) => {
      const ingredients =
        item.ingredients?.length > 0
          ? item.ingredients.join(" • ")
          : "Ingredients will be updated soon";

      return `
        <article class="dish-card" style="animation-delay: ${index * 80}ms">
          <div class="dish-body">
            <div class="dish-head">
              <div>
                <h3 class="dish-title">${item.title}</h3>
                <p class="ingredients">${ingredients}</p>
              </div>
              <span class="price-pill">${formatPrice(item.price)}</span>
            </div>
            <div class="quantity-row">
              <p class="price-note">Prepared for dine-in ordering.</p>
              <div class="quantity-controls">
                <button class="quantity-button" type="button" data-action="decrease" data-recipe-id="${item.id}">-</button>
                <span class="quantity-value" data-quantity-for="${item.id}">0</span>
                <button class="quantity-button" type="button" data-action="increase" data-recipe-id="${item.id}">+</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  bindQuantityControls();
  updateCart();
}

async function placeOrder() {
  const selectedItems = getSelectedItems();

  if (!currentRestaurant || selectedItems.length === 0) {
    return;
  }

  placeOrderButtonEl.disabled = true;
  orderStatusEl.textContent = "Submitting order...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restaurantId: currentRestaurant.id,
        tableNumber,
        items: selectedItems.map((item) => ({
          recipeId: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok || payload?.status !== "success") {
      throw new Error(payload?.message || "Unable to place order.");
    }

    selectedQuantities.clear();
    menuGridEl
      .querySelectorAll("[data-quantity-for]")
      .forEach((element) => (element.textContent = "0"));
    updateCart();
    orderStatusEl.textContent = `Order placed at ${new Date(
      payload.data.order.time,
    ).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch (error) {
    orderStatusEl.textContent = error.message;
    placeOrderButtonEl.disabled = false;
    return;
  }

  placeOrderButtonEl.disabled = false;
}

async function loadMenu() {
  if (!restaurantId) {
    setError("Missing restaurantId in the menu URL.");
    return;
  }

  try {
    const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
    const payload = await response.json();

    if (
      !response.ok ||
      payload?.status !== "success" ||
      !payload?.data?.restaurant
    ) {
      throw new Error(
        payload?.message || "Restaurant menu could not be loaded.",
      );
    }

    renderRestaurant(payload.data.restaurant);
  } catch (error) {
    setError(error.message);
  }
}

placeOrderButtonEl.addEventListener("click", placeOrder);

loadMenu();
