const DATA_URL = window.ARSENAL_DASHBOARD_DATA_URL || "arsenal-data.json";

const fallbackTeams = [
  "Arsenal",
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton & Hove Albion",
  "Chelsea",
  "Coventry City",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Hull City",
  "Ipswich Town",
  "Leeds United",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Sunderland",
  "Tottenham Hotspur"
];

const fallbackData = {
  meta: {
    source: "fallback",
    updatedAt: "2026-07-04",
    premierLeagueMode: "開幕前: アルファベット順",
    championsLeagueMode: "開幕前: 仮順位表"
  },
  premierLeague: fallbackTeams.map(team => ({
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalDifference: 0,
    points: 0
  })),
  championsLeague: [
    "Arsenal",
    "Atlético Madrid",
    "Barcelona",
    "Bayern Munich",
    "Borussia Dortmund",
    "Feyenoord",
    "Galatasaray",
    "Inter Milan",
    "Lens",
    "Manchester City",
    "Manchester United",
    "Paris Saint-Germain",
    "Porto",
    "PSV Eindhoven",
    "RB Leipzig",
    "Real Madrid",
    "Shakhtar Donetsk",
    "Villarreal"
  ].sort().map(team => ({
    team,
    played: 0,
    goalDifference: 0,
    points: 0
  })),
  fixtures: [
    {
      date: "2026-08-01", kickoffJst: "8月2日 03:00", competition: "Pre-Season Friendly", opponent: "Girona", venue: "Away", location: "Estadi Montilivi, Girona",
      opponentForm: ["unknown", "unknown", "unknown", "unknown", "unknown"]
    },
    {
      date: "2026-08-05", kickoffJst: "8月6日 03:30", competition: "Pre-Season Friendly", opponent: "Real Betis", venue: "Neutral", location: "Aviva Stadium, Dublin",
      opponentForm: ["unknown", "unknown", "unknown", "unknown", "unknown"]
    },
    {
      date: "2026-08-09", kickoffJst: "8月9日 22:00", competition: "Emirates Cup", opponent: "Borussia Dortmund", venue: "Home", location: "Emirates Stadium",
      opponentForm: ["unknown", "unknown", "unknown", "unknown", "unknown"]
    },
    {
      date: "2026-08-12", kickoffJst: "8月13日 03:30", competition: "Pre-Season Friendly", opponent: "Como 1907", venue: "Home", location: "Emirates Stadium",
      opponentForm: ["unknown", "unknown", "unknown", "unknown", "unknown"]
    },
    {
      date: "2026-08-16", kickoffJst: "8月16日 23:00", competition: "FA Community Shield", opponent: "Manchester City", venue: "Neutral", location: "Principality Stadium, Cardiff",
      opponentForm: ["unknown", "unknown", "unknown", "unknown", "unknown"]
    }
  ],
  scorers: [
    { player: "Bukayo Saka", goals: 0 },
    { player: "Martin Ødegaard", goals: 0 },
    { player: "Gabriel Martinelli", goals: 0 },
    { player: "Kai Havertz", goals: 0 },
    { player: "Declan Rice", goals: 0 }
  ],
  assists: [
    { player: "Martin Ødegaard", assists: 0 },
    { player: "Bukayo Saka", assists: 0 },
    { player: "Declan Rice", assists: 0 },
    { player: "Gabriel Martinelli", assists: 0 },
    { player: "Kai Havertz", assists: 0 }
  ]
};

const selectors = {
  plMode: document.getElementById("plMode"),
  uclMode: document.getElementById("uclMode"),
  premierLeagueTable: document.getElementById("premierLeagueTable"),
  championsLeagueTable: document.getElementById("championsLeagueTable"),
  fixtureList: document.getElementById("fixtureList"),
  scorerList: document.getElementById("scorerList"),
  assistList: document.getElementById("assistList")
};

function byTablePosition(first, second) {
  if (second.points !== first.points) {
    return second.points - first.points;
  }

  if (second.goalDifference !== first.goalDifference) {
    return second.goalDifference - first.goalDifference;
  }

  return first.team.localeCompare(second.team);
}

function byRankingValue(key) {
  return function(first, second) {
    if (second[key] !== first[key]) {
      return second[key] - first[key];
    }

    return first.player.localeCompare(second.player);
  };
}

function initials(team) {
  return team
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function renderPremierLeagueTable(teams) {
  selectors.premierLeagueTable.innerHTML = [...teams].sort(byTablePosition).map((row, index) => `
    <tr class="${row.team === "Arsenal" ? "arsenal-row" : ""}">
      <td>${index + 1}</td>
      <td>
        <span class="team-cell">
          <span class="crest">${initials(row.team)}</span>
          ${row.team}
        </span>
      </td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.drawn}</td>
      <td>${row.lost}</td>
      <td>${row.goalDifference}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("");
}

function renderChampionsLeagueTable(teams) {
  selectors.championsLeagueTable.innerHTML = [...teams].sort(byTablePosition).map((row, index) => `
    <tr class="${row.team === "Arsenal" ? "arsenal-row" : ""}">
      <td>${index + 1}</td>
      <td>
        <span class="team-cell">
          <span class="crest">${initials(row.team)}</span>
          ${row.team}
        </span>
      </td>
      <td>${row.played}</td>
      <td>${row.goalDifference}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("");
}

function formatVenue(venue) {
  if (venue === "Home") {
    return "ホーム";
  }

  if (venue === "Away") {
    return "アウェイ";
  }

  if (venue === "Neutral") {
    return "中立地";
  }

  return "未定";
}

function renderFormDots(form) {
  return form.map(result => {
    const label = result === "win" ? "勝ち" : result === "loss" ? "負け" : "分けまたは未定";
    return `<span class="form-dot ${result}" title="${label}" aria-label="${label}"></span>`;
  }).join("");
}

function renderFixtures(fixtures) {
  selectors.fixtureList.innerHTML = fixtures.slice(0, 5).map(match => `
    <article class="fixture-card">
      <div class="fixture-date">${match.date}<span>${match.kickoffJst ? ` / 日本時間 ${match.kickoffJst}` : ""}</span></div>
      <div class="fixture-opponent">
        <strong>${match.opponent}</strong>
        <span>${match.competition}</span>
      </div>
      <div>
        <div class="fixture-location">${formatVenue(match.venue)} / ${match.location}</div>
      </div>
      <div class="form-dots" aria-label="${match.opponent}の直近5戦">
        ${renderFormDots(match.opponentForm)}
      </div>
    </article>
  `).join("");
}

function renderRanking(list, target, valueKey) {
  target.innerHTML = [...list].sort(byRankingValue(valueKey)).slice(0, 5).map((row, index) => `
    <li>
      <span class="rank-number">${index + 1}</span>
      <span class="rank-name">${row.player}</span>
      <span class="rank-value">${row[valueKey]}</span>
    </li>
  `).join("");
}

function renderDashboard(data) {
  const scorers = data.scorers || fallbackData.scorers;
  const assists = data.assists || fallbackData.assists;

  renderPremierLeagueTable(data.premierLeague);
  renderChampionsLeagueTable(data.championsLeague);
  renderFixtures(data.fixtures);
  renderRanking(scorers, selectors.scorerList, "goals");
  renderRanking(assists, selectors.assistList, "assists");

  selectors.plMode.textContent = data.meta?.premierLeagueMode || "開幕前: A-Z";
  selectors.uclMode.textContent = data.meta?.championsLeagueMode || "仮置き";
}

async function loadDashboardData() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Data endpoint returned ${response.status}`);
    }

    renderDashboard(await response.json());
  } catch (error) {
    renderDashboard(fallbackData);
  }
}

loadDashboardData();
