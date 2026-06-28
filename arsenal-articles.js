const list=document.getElementById("publicArticleList");
const featured=document.getElementById("featuredArticle");
const filters=document.getElementById("categoryFilters");
const search=document.getElementById("articleSearch");
let articles=[];let category="all";
const link=a=>`arsenal-article.html?id=${encodeURIComponent(a.slug)}`;
function card(a){return `<article class="article-card"><div class="article-meta">${a.category} / ${a.publishedAt}</div><h2><a href="${link(a)}">${a.title}</a></h2><p>${a.summary}</p><a class="read-link" href="${link(a)}">記事を読む →</a></article>`}
function render(){const q=search.value.trim().toLowerCase();const visible=articles.filter(a=>(category==="all"||a.category===category)&&`${a.title} ${a.summary}`.toLowerCase().includes(q));list.innerHTML=visible.map(card).join("")||"<article class='article-card'>記事がありません。</article>";const pick=visible.find(a=>a.featured);featured.innerHTML=pick?`<div class="article-meta">Featured / ${pick.category}</div><h2><a href="${link(pick)}">${pick.title}</a></h2><p>${pick.summary}</p><a class="read-link" href="${link(pick)}">注目記事を読む →</a>`:""}
filters.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;filters.querySelectorAll("button").forEach(x=>x.classList.remove("is-active"));b.classList.add("is-active");category=b.dataset.category;render()});search.addEventListener("input",render);
fetch("arsenal-articles.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{articles=data.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));const cats=[...new Set(articles.map(a=>a.category))];filters.innerHTML=`<button class="is-active" data-category="all">すべて</button>${cats.map(c=>`<button data-category="${c}">${c}</button>`).join("")}`;render()});
