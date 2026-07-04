const DATA_URL = "arsenal-data.json";
const PLAYERS_URL = "arsenal-x-players.json";
const STORAGE_KEY = "gooners-matchday-prediction";
const RATINGS_STORAGE_KEY = "gooners-matchday-ratings";
let fixture = null;
let players = [];
let selectedPlayers = new Set();
let sharedVoting = null;

const elements = {
  competition: document.getElementById("competition"),
  matchDate: document.getElementById("matchDate"),
  matchVenue: document.getElementById("matchVenue"),
  countdown: document.getElementById("countdown"),
  opponentName: document.getElementById("opponentName"),
  opponentBadge: document.getElementById("opponentBadge"),
  opponentForm: document.getElementById("opponentForm"),
  arsenalScore: document.getElementById("arsenalScore"),
  opponentScore: document.getElementById("opponentScore"),
  opponentScoreLabel: document.getElementById("opponentScoreLabel"),
  predictionComment: document.getElementById("predictionComment"),
  saveMessage: document.getElementById("saveMessage"),
  selectionCount: document.getElementById("selectionCount"),
  playerPicker: document.getElementById("playerPicker"),
  canvas: document.getElementById("shareCanvas"),
  xShareButton: document.getElementById("xShareButton")
};

function fixtureKey() {
  return `${fixture?.date || "tbd"}-${fixture?.opponent || "opponent"}`;
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 3).map(part => part[0]).join("").toUpperCase();
}

function formatDate(date) {
  if (!date || date === "TBD") return "日程未定";
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(`${date}T12:00:00`));
}

function updateCountdown() {
  if (!fixture || fixture.date === "TBD") {
    elements.countdown.textContent = "正式日程待ち";
    return;
  }
  const difference = new Date(`${fixture.date}T20:00:00`).getTime() - Date.now();
  if (difference <= 0) {
    elements.countdown.textContent = "Matchday";
    return;
  }
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  elements.countdown.textContent = `キックオフまで ${days}日 ${hours}時間`;
}

function renderFixture() {
  elements.competition.textContent = fixture.competition;
  elements.matchDate.textContent = formatDate(fixture.date);
  elements.matchVenue.textContent = `${fixture.venue === "Home" ? "ホーム" : fixture.venue === "Away" ? "アウェイ" : "会場未定"} / ${fixture.location}`;
  elements.opponentName.textContent = fixture.opponent;
  elements.opponentBadge.textContent = initials(fixture.opponent || "TBD");
  elements.opponentScoreLabel.textContent = fixture.opponent;
  elements.opponentForm.innerHTML = fixture.opponentForm.map(result => `<span class="form-dot ${result}" title="${result}"></span>`).join("");
  document.getElementById("liveArsenalScore").textContent = fixture.arsenalScore ?? "-";
  document.getElementById("liveOpponentScore").textContent = fixture.opponentScore ?? "-";
  document.getElementById("liveOpponentCode").textContent = initials(fixture.opponent || "TBD");
  document.getElementById("matchStatus").textContent = fixture.status || "NEXT";
  renderEvents();
  updateCountdown();
}

function renderEvents() {
  const events = fixture.events || [];
  document.getElementById("eventList").innerHTML = events.length ? events.map(event => `
    <li><time>${event.minute}'</time><span class="event-icon">${event.type === "goal" ? "GOAL" : event.type === "card" ? "CARD" : "SUB"}</span><strong>${event.player}</strong><span>${event.detail || ""}</span></li>
  `).join("") : '<li class="empty-event">イベント情報はまだありません</li>';
}

function normalizedPosition(position) {
  if (position.includes("Goalkeeper")) return "Goalkeeper";
  if (position.includes("Defender")) return "Defender";
  if (position.includes("Midfielder")) return "Midfielder";
  return "Forward";
}

function renderPlayers() {
  const squad = players.filter(player => (player.group || "Player") === "Player");
  elements.playerPicker.innerHTML = squad.map(player => {
    const position = normalizedPosition(player.position);
    const checked = selectedPlayers.has(player.name) ? "checked" : "";
    return `
      <label class="player-option" data-position="${position}">
        <input type="checkbox" value="${player.name}" ${checked}>
        <span><strong>${player.name}</strong><span>${position}</span></span>
      </label>
    `;
  }).join("");

  elements.playerPicker.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked && selectedPlayers.size >= 11) {
        input.checked = false;
        elements.saveMessage.textContent = "スタメンは11人までです。";
        return;
      }
      input.checked ? selectedPlayers.add(input.value) : selectedPlayers.delete(input.value);
      updateSelectionCount();
      drawShareCard();
    });
  });
  updateSelectionCount();
  renderRatingPlayers(squad);
}

function renderRatingPlayers(squad) {
  const saved = loadRatings();
  document.getElementById("ratingList").innerHTML = squad.map(player => {
    const score = saved?.ratings?.[player.name] || 6;
    return `<div class="rating-row">
      <div class="rating-player"><span class="player-initials">${initials(player.name)}</span><span><strong>${player.name}</strong><small>${normalizedPosition(player.position)}</small></span></div>
      <label class="score-control"><span class="sr-only">${player.name}の採点</span><input type="range" data-player="${player.name}" min="1" max="10" step="0.5" value="${score}"><output>${score}</output></label>
      <label class="mom-control"><input type="radio" name="mom" value="${player.name}" ${saved?.mom === player.name ? "checked" : ""}><span>MOM</span></label>
    </div>`;
  }).join("");
  document.querySelectorAll(".score-control input").forEach(input => input.addEventListener("input", () => { input.nextElementSibling.value = input.value; }));
  if (saved) showRatingResults(saved);
  connectSharedVoting(squad);
}

async function connectSharedVoting(squad) {
  const status = document.getElementById("firebaseStatus");
  const config = window.GOONER_FIREBASE_CONFIG;
  if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
    status.textContent = "現在は端末内投票です。Firebase設定後に共有集計へ切り替わります";
    status.dataset.state = "local";
    return;
  }
  try {
    const { connectFanVoting } = await import("./arsenal-matchday-firebase.js");
    sharedVoting = await connectFanVoting({
      fixtureId: fixtureKey().replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase(),
      playerNames: squad.map(player => player.name),
      onResults: showCommunityResults,
      onStatus: state => {
        status.textContent = state === "connected" ? "共有投票に接続中" : state === "error" ? "共有集計に接続できないため端末内に保存します" : "現在は端末内投票です。Firebase設定後に共有集計へ切り替わります";
        status.dataset.state = state;
      }
    });
  } catch (error) {
    status.textContent = "現在は端末内投票です。Firebase設定後に共有集計へ切り替わります";
    status.dataset.state = "local";
  }
}

function showCommunityResults(results) {
  const topRated = Object.entries(results.ratings).sort((a, b) => b[1] - a[1])[0];
  const topMom = Object.entries(results.momVotes).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("communityVoteCount").textContent = results.voteCount;
  document.getElementById("communityMom").textContent = topMom ? `${topMom[0]} (${topMom[1]}票)` : "-";
  document.getElementById("communityTopRated").textContent = topRated ? `${topRated[0]} ${topRated[1].toFixed(1)}` : "-";
  document.getElementById("communityResults").hidden = false;
}

function loadRatings() {
  try { return (JSON.parse(localStorage.getItem(RATINGS_STORAGE_KEY)) || {})[fixtureKey()] || null; }
  catch (error) { return null; }
}

async function saveRatings(event) {
  event.preventDefault();
  const mom = new FormData(event.currentTarget).get("mom");
  if (!mom) { document.getElementById("ratingMessage").textContent = "MOMを1人選んでください。"; return; }
  const ratings = {};
  document.querySelectorAll(".score-control input").forEach(input => { ratings[input.dataset.player] = Number(input.value); });
  let allRatings = {};
  try { allRatings = JSON.parse(localStorage.getItem(RATINGS_STORAGE_KEY)) || {}; } catch (error) { allRatings = {}; }
  const ballot = { ratings, mom, votedAt: new Date().toISOString() };
  allRatings[fixtureKey()] = ballot;
  localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(allRatings));
  const message = document.getElementById("ratingMessage");
  message.textContent = "投票を保存中...";
  showRatingResults(ballot);
  if (sharedVoting) {
    try {
      await sharedVoting.submit(ballot);
      message.textContent = "採点とMOMを共有投票に反映しました。";
    } catch (error) {
      message.textContent = "共有投票に接続できないため、この端末に保存しました。";
    }
  } else {
    message.textContent = "採点とMOMをこの端末に保存しました。";
  }
}

function showRatingResults(ballot) {
  const topRated = Object.entries(ballot.ratings).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("momResult").textContent = ballot.mom;
  document.getElementById("topRatedResult").textContent = topRated ? `${topRated[0]} ${topRated[1].toFixed(1)}` : "-";
  document.getElementById("ratingResults").hidden = false;
}

function updateSelectionCount() {
  elements.selectionCount.textContent = `${selectedPlayers.size} / 11`;
}

function predictionData() {
  return {
    arsenalScore: Number(elements.arsenalScore.value),
    opponentScore: Number(elements.opponentScore.value),
    comment: elements.predictionComment.value.trim(),
    lineup: [...selectedPlayers]
  };
}

function savePrediction() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(predictionData()));
  elements.saveMessage.textContent = "この端末に予想を保存しました。";
  drawShareCard();
}

function loadPrediction() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    elements.arsenalScore.value = saved.arsenalScore ?? 2;
    elements.opponentScore.value = saved.opponentScore ?? 1;
    elements.predictionComment.value = saved.comment || "";
    selectedPlayers = new Set(saved.lineup || []);
  } catch (error) {
    selectedPlayers = new Set();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = [...text];
  let line = "";
  let lineNumber = 0;
  chars.forEach(char => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lineNumber < maxLines) ctx.fillText(line, x, y + lineNumber * lineHeight);
      line = char;
      lineNumber += 1;
    } else {
      line = test;
    }
  });
  if (lineNumber < maxLines) ctx.fillText(line, x, y + lineNumber * lineHeight);
}

function drawShareCard() {
  if (!fixture) return;
  const ctx = elements.canvas.getContext("2d");
  const data = predictionData();
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#8a1016");
  gradient.addColorStop(.62, "#d71920");
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.beginPath();
  ctx.arc(930, 320, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c542";
  ctx.font = "bold 24px Arial";
  ctx.fillText("GOONER’S DUSHBOARD / MATCHDAY PREDICTION", 64, 70);
  ctx.fillStyle = "white";
  ctx.font = "bold 55px Arial";
  ctx.fillText(`ARSENAL  ${data.arsenalScore} - ${data.opponentScore}  ${fixture.opponent.toUpperCase()}`, 64, 175);
  ctx.font = "28px Arial";
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.fillText(`${fixture.competition} / ${formatDate(fixture.date)} / ${fixture.location}`, 64, 225);
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  wrapText(ctx, data.comment || "COYG!", 64, 300, 650, 34, 3);
  ctx.fillStyle = "#f4c542";
  ctx.font = "bold 20px Arial";
  ctx.fillText(`STARTING XI (${data.lineup.length}/11)`, 64, 430);
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  wrapText(ctx, data.lineup.join(" / ") || "Lineup not selected", 64, 468, 820, 29, 4);
  ctx.font = "bold 22px Arial";
  ctx.fillText("arsenal23vm-netizen.github.io/gooners-dushboard", 64, 590);
  updateShareLinks();
}

function shareText() {
  const data = predictionData();
  return `Arsenal ${data.arsenalScore}-${data.opponentScore} ${fixture.opponent}\n${data.comment || "COYG!"}\n#Arsenal #GoonersDushboard`;
}

function updateShareLinks() {
  elements.xShareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(location.href)}`;
}

async function sharePrediction() {
  const data = { title: "Arsenal Matchday Prediction", text: shareText(), url: location.href };
  if (navigator.share) {
    await navigator.share(data).catch(() => {});
  } else {
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
    elements.saveMessage.textContent = "共有文をコピーしました。";
  }
}

function downloadCard() {
  drawShareCard();
  const link = document.createElement("a");
  link.download = `arsenal-prediction-${fixture.date}.png`;
  link.href = elements.canvas.toDataURL("image/png");
  link.click();
}

document.getElementById("savePrediction").addEventListener("click", savePrediction);
document.getElementById("shareButton").addEventListener("click", sharePrediction);
document.getElementById("downloadCard").addEventListener("click", downloadCard);
document.getElementById("copyLink").addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  elements.saveMessage.textContent = "URLをコピーしました。";
});
document.getElementById("ratingsForm").addEventListener("submit", saveRatings);
document.getElementById("resetRatings").addEventListener("click", () => {
  document.querySelectorAll(".score-control input").forEach(input => { input.value = 6; input.nextElementSibling.value = 6; });
  document.querySelectorAll('input[name="mom"]').forEach(input => { input.checked = false; });
  document.getElementById("ratingMessage").textContent = "入力をリセットしました。";
});
[elements.arsenalScore, elements.opponentScore, elements.predictionComment].forEach(input => input.addEventListener("input", drawShareCard));
document.getElementById("positionFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-position]");
  if (!button) return;
  document.querySelectorAll("#positionFilters button").forEach(item => item.classList.remove("is-active"));
  button.classList.add("is-active");
  document.querySelectorAll(".player-option").forEach(option => {
    option.dataset.hidden = String(button.dataset.position !== "all" && option.dataset.position !== button.dataset.position);
  });
});

Promise.all([
  fetch(DATA_URL, { cache: "no-store" }).then(response => response.json()),
  fetch(PLAYERS_URL, { cache: "no-store" }).then(response => response.json())
]).then(([data, playerData]) => {
  fixture = data.fixtures[0];
  players = playerData;
  loadPrediction();
  renderFixture();
  renderPlayers();
  drawShareCard();
  setInterval(updateCountdown, 60000);
});
