(function() {
  const config = window.GOONER_ADS;

  if (!config || !config.enabled || !config.adsenseClient.includes("ca-pub-")) {
    return;
  }

  const adSlots = document.querySelectorAll("[data-ad-slot]");

  if (adSlots.length === 0) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClient}`;
  document.head.append(script);

  adSlots.forEach(slot => {
    const slotName = slot.dataset.adSlot;
    const adSlotId = config.slots[slotName];

    if (!adSlotId || adSlotId === "0000000000") {
      return;
    }

    slot.innerHTML = `
      <span>Advertisement</span>
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="${config.adsenseClient}"
        data-ad-slot="${adSlotId}"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
    `;

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  });
})();
