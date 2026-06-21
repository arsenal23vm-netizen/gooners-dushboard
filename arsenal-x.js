const PLAYER_DATA_URL = "arsenal-x-players.json";

const fallbackPlayers = [
  { name: "Mikel Arteta", handle: "m8arteta", position: "Manager", group: "Staff" },
  { name: "Arsenal", handle: "Arsenal", position: "Club official", group: "Club" },
  { name: "Bukayo Saka", handle: "BukayoSaka87", position: "Forward" },
  { name: "Declan Rice", handle: "_DeclanRice", position: "Midfielder" },
  { name: "Martin Ødegaard", handle: "odegaard98", position: "Midfielder" },
  { name: "Kai Havertz", handle: "kaihavertz29", position: "Forward" },
  { name: "Gabriel Jesus", handle: "gabrieljesus9", position: "Forward" },
  { name: "Jurrien Timber", handle: "JurrienTimber", position: "Defender" }
];

const timelineGrid = document.getElementById("timelineGrid");
const playerSearch = document.getElementById("playerSearch");
const template = document.getElementById("timelineTemplate");
let isWidgetScriptLoading = false;

function createTimelineCard(player) {
  const card = template.content.firstElementChild.cloneNode(true);
  const handle = player.handle?.trim();
  const profileUrl = handle ? `https://twitter.com/${handle}` : "";

  card.dataset.search = `${player.name} ${handle || ""} ${player.position} ${player.group || ""}`.toLowerCase();
  card.querySelector("h2").textContent = player.name;
  card.querySelector(".position").textContent = handle
    ? `${player.group || "Player"} / ${player.position} / @${handle}`
    : `${player.group || "Player"} / ${player.position} / X未登録・未確認`;

  if (!handle) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-timeline";
    emptyState.textContent = "この人物のXアカウントは未設定です。確認できたら arsenal-x-players.json に handle を追加してください。";
    card.querySelector(".x-link").remove();
    card.querySelector(".timeline-frame").append(emptyState);
    return card;
  }

  const timelineLink = document.createElement("a");
  timelineLink.className = "twitter-timeline";
  timelineLink.href = profileUrl;
  timelineLink.dataset.height = "520";
  timelineLink.dataset.chrome = "noheader nofooter noborders transparent";
  timelineLink.textContent = `Tweets by ${handle}`;

  card.querySelector(".x-link").href = profileUrl;
  card.querySelector(".timeline-frame").append(timelineLink);
  return card;
}

function renderPlayers(players) {
  timelineGrid.innerHTML = "";
  timelineGrid.append(...players.map(createTimelineCard));
  loadXWidgets();
}

function loadXWidgets() {
  if (window.twttr?.widgets) {
    window.twttr.widgets.load(timelineGrid);
    return;
  }

  if (isWidgetScriptLoading) {
    return;
  }

  isWidgetScriptLoading = true;
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.charset = "utf-8";
  script.onload = () => {
    window.twttr?.widgets?.load(timelineGrid);
  };
  document.body.append(script);
}

function filterPlayers() {
  const query = playerSearch.value.trim().toLowerCase();

  document.querySelectorAll(".timeline-card").forEach(card => {
    card.dataset.hidden = String(!card.dataset.search.includes(query));
  });
}

async function loadPlayers() {
  try {
    const response = await fetch(PLAYER_DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Player data returned ${response.status}`);
    }

    renderPlayers(await response.json());
  } catch (error) {
    renderPlayers(fallbackPlayers);
  }
}

playerSearch.addEventListener("input", filterPlayers);
loadPlayers();
