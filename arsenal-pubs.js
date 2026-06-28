const PUB_DATA_URL = "arsenal-pubs-data.json";
const prefectureFilter = document.getElementById("prefectureFilter");
const pubSearch = document.getElementById("pubSearch");
const prefectureList = document.getElementById("prefectureList");
const venueSummary = document.getElementById("venueSummary");
let pubData = [];

function mapUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function createVenueCard(venue) {
  const article = document.createElement("article");
  article.className = "venue-card";
  article.dataset.search = `${venue.name} ${venue.address} ${venue.feature} ${venue.categoryLabel}`.toLowerCase();
  article.innerHTML = `
    <div class="venue-top">
      <h3>${venue.name}</h3>
      <span class="badge ${venue.category}">${venue.categoryLabel}</span>
    </div>
    <p class="venue-feature">${venue.feature}</p>
    <p class="venue-address">${venue.address}</p>
    <p class="venue-note">${venue.note}</p>
    <div class="venue-links">
      <a href="${venue.url}" target="_blank" rel="noopener noreferrer">公式・店舗情報</a>
      <a class="map" href="${mapUrl(venue.address)}" target="_blank" rel="noopener noreferrer">地図</a>
    </div>
  `;
  return article;
}

function createPrefectureSection(item) {
  const section = document.createElement("section");
  section.className = "prefecture-section";
  section.dataset.prefecture = item.prefecture;
  section.dataset.region = item.region;

  const heading = document.createElement("div");
  heading.className = "prefecture-heading";
  heading.innerHTML = `<h2>${item.prefecture}</h2><span>${item.venues.length}件</span>`;
  section.append(heading);

  if (item.venues.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-prefecture";
    empty.textContent = "現在、Web上で確認できるアーセナル観戦店情報はありません。情報募集中です。";
    section.append(empty);
    return section;
  }

  const grid = document.createElement("div");
  grid.className = "venue-grid";
  grid.append(...item.venues.map(createVenueCard));
  section.append(grid);
  return section;
}

function applyFilters() {
  const selected = prefectureFilter.value;
  const query = pubSearch.value.trim().toLowerCase();
  let visibleVenues = 0;

  document.querySelectorAll(".prefecture-section").forEach(section => {
    const matchesPrefecture = selected === "all" || section.dataset.prefecture === selected;
    let sectionHasMatch = false;
    const cards = section.querySelectorAll(".venue-card");

    cards.forEach(card => {
      const matchesSearch = card.dataset.search.includes(query);
      card.hidden = !matchesSearch;
      if (matchesSearch) {
        sectionHasMatch = true;
        visibleVenues += 1;
      }
    });

    const hasNoVenues = cards.length === 0;
    const showEmpty = hasNoVenues && query === "";
    section.dataset.hidden = String(!matchesPrefecture || (!sectionHasMatch && !showEmpty));
  });

  venueSummary.textContent = `${visibleVenues}店舗を表示`;
}

function render(data) {
  pubData = data;
  prefectureFilter.innerHTML = `<option value="all">全国</option>${data.map(item => `<option value="${item.prefecture}">${item.prefecture}</option>`).join("")}`;
  prefectureList.replaceChildren(...data.map(createPrefectureSection));
  applyFilters();
}

prefectureFilter.addEventListener("change", applyFilters);
pubSearch.addEventListener("input", applyFilters);

fetch(PUB_DATA_URL, { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error(`Pub data returned ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(() => {
    prefectureList.innerHTML = `<div class="empty-prefecture">店舗データを読み込めませんでした。</div>`;
  });
