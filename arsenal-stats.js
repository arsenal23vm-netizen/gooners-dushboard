const PLAYER_URL = "arsenal-x-players.json";
const STATS_URL = "arsenal-stats-data.json";

const defaults = {
  appearances: 0, starts: 0, minutes: 0, distanceKm: 0, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0,
  xG: 0, xA: 0, touchesBox: 0, keyPasses: 0, chancesCreated: 0, bigChancesCreated: 0, passes: 0,
  passesCompleted: 0, passAccuracy: 0, progressivePasses: 0, crossesCompleted: 0, carries: 0, progressiveCarries: 0,
  duelsWon: 0, duelsContested: 0, duelWinPct: 0, aerialsWon: 0, tacklesWon: 0, interceptions: 0, recoveries: 0,
  clearances: 0, blocks: 0, errorsLeadingShot: 0, foulsWon: 0, foulsCommitted: 0, yellowCards: 0, redCards: 0,
  saves: 0, savePct: 0, cleanSheets: 0, goalsConceded: 0, claims: 0, punches: 0, sweeperActions: 0
};

const categories = {
  overview: [["出場 / Apps","appearances"],["先発 / Starts","starts"],["出場時間 / Min","minutes"],["走行距離 / km","distanceKm",1],["得点 / G","goals"],["アシスト / A","assists"],["キーパス / KP","keyPasses"],["チャンス創出 / CC","chancesCreated"],["デュエル勝利 / DW","duelsWon"]],
  attack: [["得点 / Goals","goals"],["アシスト / Assists","assists"],["シュート / Shots","shots"],["枠内 / On target","shotsOnTarget"],["xG","xG",2],["xA","xA",2],["PA内タッチ / Box touches","touchesBox"],["決定機創出 / Big chances","bigChancesCreated"]],
  passing: [["パス / Passes","passes"],["成功 / Completed","passesCompleted"],["成功率 / Accuracy","passAccuracy",1,"%"],["キーパス / Key passes","keyPasses"],["チャンス創出 / Chances","chancesCreated"],["前進パス / Progressive","progressivePasses"],["クロス成功 / Crosses","crossesCompleted"]],
  physical: [["走行距離 / km","distanceKm",1],["キャリー / Carries","carries"],["前進キャリー / Progressive","progressiveCarries"],["デュエル / Duels","duelsContested"],["勝利 / Won","duelsWon"],["勝率 / Win %","duelWinPct",1,"%"],["空中戦勝利 / Aerials","aerialsWon"],["被ファウル / Fouls won","foulsWon"]],
  defending: [["タックル成功 / Tackles","tacklesWon"],["インターセプト / INT","interceptions"],["リカバリー / REC","recoveries"],["クリア / Clearances","clearances"],["ブロック / Blocks","blocks"],["失策 / Errors","errorsLeadingShot"],["ファウル / Fouls","foulsCommitted"],["黄 / YC","yellowCards"],["赤 / RC","redCards"]],
  goalkeeping: [["出場 / Apps","appearances"],["出場時間 / Min","minutes"],["セーブ / Saves","saves"],["セーブ率 / Save %","savePct",1,"%"],["無失点 / CS","cleanSheets"],["失点 / GC","goalsConceded"],["ハイボール処理 / Claims","claims"],["パンチング / Punches","punches"],["飛び出し / Sweeper","sweeperActions"]]
};

const categoryTitles = { overview:"概要 / Overview", attack:"攻撃 / Attack", passing:"パス / Passing", physical:"走行・デュエル / Physical", defending:"守備 / Defending", goalkeeping:"GK / Goalkeeping" };
let squad = [];
let activeCategory = "overview";

function positionKey(position) { if(position.includes("Goalkeeper"))return "Goalkeeper";if(position.includes("Defender"))return "Defender";if(position.includes("Midfielder"))return "Midfielder";return "Forward"; }
function positionLabel(position) { return ({Goalkeeper:"GK",Defender:"DF",Midfielder:"MF",Forward:"FW"})[positionKey(position)]; }
function initials(name) { return [...name.replace(/[・＝]/g,"")].slice(0,2).join(""); }
function valueText(row, column) { const value=row[column[1]]??0; return `${Number(value).toFixed(column[2]||0)}${column[3]||""}`; }

function render() {
  const query = document.getElementById("playerSearch").value.trim().toLowerCase();
  const position = document.getElementById("positionFilter").value;
  const effectivePosition = activeCategory === "goalkeeping" && position === "all" ? "Goalkeeper" : position;
  const sortKey = document.getElementById("sortKey").value;
  const rows = squad.filter(row => (effectivePosition === "all" || positionKey(row.position) === effectivePosition) && `${row.displayName} ${row.name}`.toLowerCase().includes(query)).sort((a,b)=>(b[sortKey]||0)-(a[sortKey]||0)||a.displayName.localeCompare(b.displayName,"ja"));
  const columns = categories[activeCategory];
  document.getElementById("statsHead").innerHTML = `<tr><th>選手 / Player</th>${columns.map(column=>`<th>${column[0]}</th>`).join("")}</tr>`;
  document.getElementById("statsBody").innerHTML = rows.map(row=>`<tr><td><span class="player-cell"><span class="player-mark">${initials(row.displayName)}</span><span><strong>${row.displayName}</strong><small>${positionLabel(row.position)}</small></span></span></td>${columns.map(column=>`<td>${valueText(row,column)}</td>`).join("")}</tr>`).join("");
  document.getElementById("tableTitle").textContent = categoryTitles[activeCategory];
}

async function loadStats() {
  try {
    const [people, data] = await Promise.all([PLAYER_URL,STATS_URL].map(url=>fetch(url,{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error(response.status);return response.json();})));
    squad = people.filter(person=>person.group === "Player").map(player=>({ ...defaults, ...(data.players[player.name]||{}), name:player.name, displayName:player.displayName||player.name, position:player.position }));
    document.getElementById("seasonLabel").textContent=data.meta.season;
    document.getElementById("playerCount").textContent=squad.length;
    document.getElementById("totalMinutes").textContent=squad.reduce((sum,row)=>sum+row.minutes,0).toLocaleString("ja-JP");
    document.getElementById("totalDistance").textContent=`${squad.reduce((sum,row)=>sum+row.distanceKm,0).toFixed(1)} km`;
    document.getElementById("updatedAt").textContent=data.meta.updatedAt;
    document.getElementById("dataStatus").textContent=data.meta.status;
    render();
  } catch(error) { document.getElementById("statsBody").innerHTML='<tr><td>スタッツを読み込めませんでした。</td></tr>'; }
}

document.getElementById("categoryTabs").addEventListener("click",event=>{const button=event.target.closest("[data-category]");if(!button)return;activeCategory=button.dataset.category;document.querySelectorAll("#categoryTabs button").forEach(item=>item.classList.toggle("is-active",item===button));render();});
["playerSearch","positionFilter","sortKey"].forEach(id=>document.getElementById(id).addEventListener(id==="playerSearch"?"input":"change",render));
loadStats();
