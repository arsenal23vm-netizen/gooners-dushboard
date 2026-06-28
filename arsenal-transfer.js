const TRANSFER_DATA_URL = window.ARSENAL_TRANSFER_DATA_URL || "arsenal-transfer-data.json";
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
  const titleLink = card.querySelector(".article-title-link");
  titleLink.textContent = article.title;
  titleLink.href = article.url;
  card.querySelector("p").textContent = article.summary;
  card.querySelector(".source").textContent = article.source;
  card.querySelector(".article-footer a").href = article.url;
  return card;
}

function createRadarRow(item, index) {
  const row = document.createElement("tr");
  row.dataset.tier = item.tier;
  const playerInitials = item.player
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
  const photo = item.photo
    ? `<img class="player-photo" src="${item.photo}" alt="${item.player}" loading="lazy">`
    : `<span class="player-photo-placeholder" aria-label="写真未設定">${playerInitials}</span>`;
  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${photo}</td>
    <td class="player-name">${item.player}</td>
    <td>${item.position}</td>
    <td>${item.club}</td>
    <td class="market-value">
      <strong>${item.marketValue}</strong>
      <small>${item.marketValueUpdated}</small>
    </td>
    <td>
      <div class="probability">
        <strong>${item.probability}%</strong>
        <span class="probability-bar"><span style="width:${item.probability}%"></span></span>
      </div>
    </td>
    <td><span class="deal-type">${item.dealType}</span></td>
    <td><a class="related-link" href="${item.articleUrl}" target="_blank" rel="noopener noreferrer">${item.articleLabel} ↗</a></td>
  `;

  const image = row.querySelector(".player-photo");
  image?.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "player-photo-placeholder";
    fallback.textContent = playerInitials;
    fallback.setAttribute("aria-label", "写真を読み込めませんでした");
    image.replaceWith(fallback);
  });

  return row;
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
  articleGrid.innerHTML = "";
  radarList.innerHTML = "";
  xGrid.innerHTML = "";
  articleGrid.append(...data.articles.map(createArticleCard));
  radarList.append(...data.radar.map(createRadarRow));
  xGrid.append(...data.xAccounts.map(createXCard));
  updatedAt.textContent = `最終更新: ${data.updatedAt}`;
  applyFilter();
  loadXWidgets();
}

async function refreshTransferData() {
  try {
    const response = await fetch(`${TRANSFER_DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Transfer data returned ${response.status}`);
    render(await response.json());
  } catch (error) {
    updatedAt.textContent = "移籍データを読み込めませんでした";
  }
}

document.getElementById("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  document.querySelectorAll(".filter").forEach(item => item.classList.remove("is-active"));
  button.classList.add("is-active");
  activeFilter = button.dataset.filter;
  applyFilter();
});

refreshTransferData();
setInterval(refreshTransferData, 5 * 60 * 1000);
