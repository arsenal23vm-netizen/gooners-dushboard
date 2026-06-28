const TRANSFER_DATA_URL = "arsenal-transfer-data.json";
const articleGrid = document.getElementById("articleGrid");
const radarList = document.getElementById("radarList");
const xGrid = document.getElementById("xGrid");
const articleTemplate = document.getElementById("articleTemplate");
const updatedAt = document.getElementById("updatedAt");
let activeFilter = "all";
let widgetScriptLoading = false;

function createArticleCard(article) {
  const card = articleTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.tier = article.tier;
  const tier = card.querySelector(".tier");
  tier.className = `tier ${article.tier}`;
  tier.textContent = article.tierLabel;
  card.querySelector("time").textContent = article.date;
  card.querySelector("h3").textContent = article.title;
  card.querySelector("p").textContent = article.summary;
  card.querySelector(".source").textContent = article.source;
  card.querySelector("a").href = article.url;
  return card;
}

function createRadarItem(item) {
  const article = document.createElement("article");
  article.className = "radar-item";
  article.dataset.tier = item.tier;
  article.innerHTML = `
    <div class="radar-row">
      <h3>${item.player}</h3>
      <span class="status">${item.status}</span>
    </div>
    <p>${item.position} / ${item.note}</p>
  `;
  return article;
}

function createXCard(account) {
  const card = document.createElement("article");
  const profileUrl = `https://twitter.com/${account.handle}`;
  card.className = "x-card";
  card.innerHTML = `
    <div class="x-card-head">
      <h3>${account.name} <small>@${account.handle}</small></h3>
      <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">Xで開く</a>
    </div>
    <div class="x-frame">
      <a class="twitter-timeline"
        data-height="480"
        data-chrome="noheader nofooter noborders transparent"
        href="${profileUrl}">Posts by ${account.handle}</a>
    </div>
  `;
  return card;
}

function applyFilter() {
  document.querySelectorAll("[data-tier]").forEach(item => {
    item.dataset.hidden = String(activeFilter !== "all" && item.dataset.tier !== activeFilter);
  });
}

function loadXWidgets() {
  if (window.twttr?.widgets) {
    window.twttr.widgets.load(xGrid);
    return;
  }
  if (widgetScriptLoading) return;
  widgetScriptLoading = true;
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.charset = "utf-8";
  script.onload = () => window.twttr?.widgets?.load(xGrid);
  document.body.append(script);
}

function render(data) {
  articleGrid.append(...data.articles.map(createArticleCard));
  radarList.append(...data.radar.map(createRadarItem));
  xGrid.append(...data.xAccounts.map(createXCard));
  updatedAt.textContent = `最終更新: ${data.updatedAt}`;
  loadXWidgets();
}

document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  document.querySelectorAll(".filter").forEach(item => item.classList.remove("is-active"));
  button.classList.add("is-active");
  activeFilter = button.dataset.filter;
  applyFilter();
});

fetch(TRANSFER_DATA_URL, { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error(`Transfer data returned ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(() => {
    updatedAt.textContent = "移籍データを読み込めませんでした";
  });
