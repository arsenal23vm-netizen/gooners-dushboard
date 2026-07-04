document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop() || "index.html";
  const isHome = page === "arsenal.html" || page === "index.html" || page === "";

  const skipLink = document.createElement("a");
  skipLink.className = "skip-link";
  skipLink.href = "#pageContent";
  skipLink.textContent = "本文へ移動 / Skip to content";
  document.body.prepend(skipLink);

  const main = document.querySelector("main");
  if (main && !main.id) main.id = "pageContent";

  const navLinks = [...document.querySelectorAll(".nav-links a, .nav-actions a, .article-topbar a")];
  const activeLink = navLinks.find(link => (link.getAttribute("href") || "").split("#")[0] === page);
  if (activeLink) {
    activeLink.setAttribute("aria-current", "page");
    setTimeout(() => activeLink.scrollIntoView({ block: "nearest", inline: "center" }), 0);
  }

  const tools = document.createElement("nav");
  tools.className = "site-tools";
  tools.setAttribute("aria-label", "ページ操作 / Page tools");
  if (!isHome) tools.insertAdjacentHTML("beforeend", '<a href="arsenal.html" title="ホームへ戻る / Back to home">HOME</a>');
  tools.insertAdjacentHTML("beforeend", '<button type="button" data-tool="copy" title="ページURLをコピー / Copy page URL">LINK</button><button type="button" data-tool="top" title="ページ上部へ戻る / Back to top">TOP</button>');
  document.body.append(tools);

  const topButton = tools.querySelector('[data-tool="top"]');
  const copyButton = tools.querySelector('[data-tool="copy"]');
  const updateTopButton = () => topButton.classList.toggle("is-visible", scrollY > 500);
  addEventListener("scroll", updateTopButton, { passive: true });
  updateTopButton();
  topButton.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyButton.textContent = "COPIED";
      setTimeout(() => { copyButton.textContent = "LINK"; }, 1200);
    } catch (error) {
      copyButton.textContent = "ERROR";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    const search = document.querySelector('input[type="search"]');
    if (search) { event.preventDefault(); search.focus(); }
  });
});
