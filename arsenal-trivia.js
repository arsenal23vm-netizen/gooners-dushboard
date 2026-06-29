const tableBody = document.getElementById("triviaTable");
const categoryFilter = document.getElementById("categoryFilter");
const triviaSearch = document.getElementById("triviaSearch");
const totalCount = document.getElementById("totalCount");
const categoryCount = document.getElementById("categoryCount");
const visibleCount = document.getElementById("visibleCount");
const emptyState = document.getElementById("emptyState");

let triviaItems = [];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function renderCategories(items) {
  const categories = [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "ja"));
  categoryCount.textContent = categories.length;

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function itemMatches(item) {
  const selectedCategory = categoryFilter.value;
  const query = normalize(triviaSearch.value);
  const haystack = normalize(`${item.year} ${item.category} ${item.topic} ${item.trivia} ${item.why}`);

  return (selectedCategory === "all" || item.category === selectedCategory) && haystack.includes(query);
}

function renderTable() {
  const rows = triviaItems.filter(itemMatches);
  tableBody.innerHTML = "";
  visibleCount.textContent = `${rows.length}件`;
  emptyState.hidden = rows.length > 0;

  rows.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="number-cell">${index + 1}</td>
      <td class="year-cell">${item.year}</td>
      <td><span class="category-pill">${item.category}</span></td>
      <td class="topic-cell">${item.topic}</td>
      <td>${item.trivia}</td>
      <td>${item.why}</td>
      <td><a class="source-link" href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">${item.sourceName}</a></td>
    `;
    tableBody.appendChild(row);
  });
}

async function loadTrivia() {
  try {
    const response = await fetch("arsenal-trivia-data.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    triviaItems = (await response.json()).sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
    totalCount.textContent = triviaItems.length;
    renderCategories(triviaItems);
    renderTable();
  } catch (error) {
    tableBody.innerHTML = "";
    visibleCount.textContent = "0件";
    emptyState.hidden = false;
    emptyState.textContent = "トリビアデータを読み込めませんでした。";
    console.error("Failed to load trivia data:", error);
  }
}

categoryFilter.addEventListener("change", renderTable);
triviaSearch.addEventListener("input", renderTable);

loadTrivia();
