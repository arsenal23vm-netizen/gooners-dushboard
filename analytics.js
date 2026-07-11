(function () {
  const config = window.GOONERS_ANALYTICS_CONFIG || {};
  const gaId = config.gaId;

  if (!gaId || gaId === "G-XXXXXXXXXX") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", gaId, {
    page_path: `${location.pathname}${location.search}`,
  });

  function sendEvent(action, params) {
    if (!window.gtag) return;
    window.gtag("event", action, {
      page_path: `${location.pathname}${location.search}`,
      ...params,
    });
  }

  window.goonersAnalytics = {
    event: sendEvent,
    trackCtaClick(label, locationName) {
      sendEvent("cta_click", { label, location: locationName });
    },
    trackOutboundClick(label, url) {
      sendEvent("outbound_click", { label, url });
    },
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    const label = (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);
    const isOutbound = /^https?:\/\//.test(href) && !href.includes(location.hostname);
    const isCta =
      link.classList.contains("hero-primary") ||
      link.classList.contains("hub-card") ||
      link.classList.contains("text-link") ||
      link.classList.contains("button");

    if (isCta) {
      sendEvent("cta_click", {
        label: label || href,
        location: document.title || "gooners_dushboard",
      });
    }

    if (isOutbound) {
      sendEvent("outbound_click", {
        label: label || href,
        url: link.href,
      });
    }
  });
})();
