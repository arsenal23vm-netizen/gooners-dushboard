const ARTICLES_URL = "arsenal-articles.json";
const STORAGE_KEY = "gooners-article-admin";
let articles = [];
let activeId = "";

const fields = {
  id: document.getElementById("articleId"),
  title: document.getElementById("articleTitle"),
  slug: document.getElementById("articleSlug"),
  category: document.getElementById("articleCategory"),
  author: document.getElementById("articleAuthor"),
  publishedAt: document.getElementById("articlePublishedAt"),
  summary: document.getElementById("articleSummary"),
  body: document.getElementById("articleBody"),
  image: document.getElementById("articleImage"),
  sources: document.getElementById("articleSources"),
  featured: document.getElementById("articleFeatured")
};

function today() { return new Date().toISOString().slice(0,10); }
function createId() { return `article-${Date.now()}`; }
function slugify(text) { return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-"); }
function persist() { localStorage.setItem(STORAGE_KEY,JSON.stringify(articles)); }

function clearForm() {
  activeId = "";
  fields.id.value = "";
  fields.title.value = "";
  fields.slug.value = "";
  fields.category.value = "Match Preview";
  fields.author.value = "Gooner’s Dushboard Editorial";
  fields.publishedAt.value = today();
  fields.summary.value = "";
  fields.body.value = "";
  fields.image.value = "";
  fields.sources.value = "";
  fields.featured.checked = false;
  renderList();
}

function fillForm(article) {
  activeId = article.id;
  Object.entries(fields).forEach(([key,input]) => {
    if (key === "sources") input.value = (article.sources || []).join("\n");
    else if (key === "featured") input.checked = Boolean(article.featured);
    else input.value = article[key] || "";
  });
  renderList();
}

function formArticle() {
  const existing = articles.find(article => article.id === activeId);
  return {
    id: activeId || createId(),
    title: fields.title.value.trim(),
    slug: fields.slug.value.trim(),
    category: fields.category.value,
    author: fields.author.value.trim(),
    publishedAt: fields.publishedAt.value || today(),
    updatedAt: today(),
    summary: fields.summary.value.trim(),
    body: fields.body.value.trim(),
    image: fields.image.value.trim(),
    sources: fields.sources.value.split("\n").map(item => item.trim()).filter(Boolean),
    featured: fields.featured.checked,
    createdAt: existing?.createdAt || new Date().toISOString()
  };
}

function renderList() {
  const query = document.getElementById("articleSearch").value.trim().toLowerCase();
  const list = articles.filter(article => `${article.title} ${article.category}`.toLowerCase().includes(query));
  document.getElementById("adminArticleList").innerHTML = list.map(article => `
    <article class="admin-article-item ${article.id===activeId?"is-active":""}" data-id="${article.id}">
      <strong>${article.title}</strong>
      <span>${article.category} / ${article.publishedAt}</span>
    </article>
  `).join("") || "<p>記事がありません。</p>";
}

function saveArticle(event) {
  event.preventDefault();
  const article = formArticle();
  const duplicate = articles.find(item => item.slug === article.slug && item.id !== article.id);
  if (duplicate) {
    document.getElementById("adminMessage").textContent = "同じスラッグの記事があります。";
    return;
  }
  const index = articles.findIndex(item => item.id === article.id);
  if (index >= 0) articles[index] = article;
  else articles.unshift(article);
  activeId = article.id;
  persist();
  renderList();
  document.getElementById("adminMessage").textContent = "ブラウザ内に保存しました。";
}

function exportArticles() {
  const sorted = [...articles].sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
  const blob = new Blob([JSON.stringify(sorted,null,2)],{type:"application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "arsenal-articles.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function preview() {
  const article = formArticle();
  const container = document.getElementById("previewContent");
  container.innerHTML = "";
  const title = document.createElement("h1");
  title.textContent = article.title || "無題の記事";
  container.append(title);
  article.body.split(/\n\s*\n/).filter(Boolean).forEach(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    container.append(paragraph);
  });
  document.getElementById("previewDialog").showModal();
}

document.getElementById("articleForm").addEventListener("submit",saveArticle);
document.getElementById("newArticle").addEventListener("click",clearForm);
document.getElementById("exportArticles").addEventListener("click",exportArticles);
document.getElementById("previewArticle").addEventListener("click",preview);
document.getElementById("closePreview").addEventListener("click",()=>document.getElementById("previewDialog").close());
document.getElementById("articleSearch").addEventListener("input",renderList);
fields.title.addEventListener("blur",()=>{ if(!fields.slug.value) fields.slug.value=slugify(fields.title.value); });
document.getElementById("adminArticleList").addEventListener("click",event=>{
  const item=event.target.closest("[data-id]");
  if(item) fillForm(articles.find(article=>article.id===item.dataset.id));
});
document.getElementById("deleteArticle").addEventListener("click",()=>{
  if(!activeId || !confirm("この記事を削除しますか？")) return;
  articles=articles.filter(article=>article.id!==activeId);
  persist();
  clearForm();
});
document.getElementById("importArticles").addEventListener("change",async event=>{
  const data=JSON.parse(await event.target.files[0].text());
  if(!Array.isArray(data)) throw new Error("記事JSONは配列である必要があります。");
  articles=data;
  persist();
  clearForm();
});

async function initialize() {
  const saved=localStorage.getItem(STORAGE_KEY);
  articles=saved?JSON.parse(saved):await fetch(ARTICLES_URL,{cache:"no-store"}).then(response=>response.json());
  clearForm();
}
initialize();
