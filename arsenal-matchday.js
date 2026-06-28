const DATA_URL = "arsenal-data.json";
const PLAYERS_URL = "arsenal-x-players.json";
const STORAGE_KEY = "gooners-matchday-prediction";
let fixture = null;
let players = [];
let selectedPlayers = new Set();

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
  updateCountdown();
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
