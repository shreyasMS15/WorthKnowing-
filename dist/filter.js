const filters = document.querySelector(".filters");
const buttons = [...filters.querySelectorAll("button")];
const cards = [...document.querySelectorAll("[data-topic]")];
const status = document.querySelector("#filter-status");
const categoryKey = "smallstack-article-category";

function selectCategory(button) {
  const category = button.dataset.category;
  buttons.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
  for (const card of cards) {
    card.hidden = category !== "all" && card.dataset.topic !== category;
  }
  const visible = cards.filter((card) => !card.hidden).length;
  status.textContent = `${visible} ${visible === 1 ? "article" : "articles"} shown`;
}

if (location.hash === "#latest") {
  try {
    const savedCategory = sessionStorage.getItem(categoryKey);
    const savedButton = buttons.find((button) => button.dataset.category === savedCategory);
    if (savedButton) selectCategory(savedButton);
  } catch {
    // The category list still works when browser storage is unavailable.
  }
}

filters.hidden = false;
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  selectCategory(button);
  try {
    sessionStorage.setItem(categoryKey, button.dataset.category);
  } catch {
    // Storage is optional for restoring the filter on return.
  }
});
