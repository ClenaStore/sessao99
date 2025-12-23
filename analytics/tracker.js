(() => {
  const SUPABASE_URL = "https://dxkszikemntfusfyrzos.supabase.co";
  const SUPABASE_KEY = "sb_publishable_NNFvdfSXgOdGGVcSbphbjQ_brC3_9ed";

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const MIN_SECONDS = 10;

  let startedAt = null;
  let saved = false;

  function getContext() {
    return window.__CLENA_CONTEXT__ || null;
  }

  function startSession() {
    if (startedAt) return;
    startedAt = Date.now();
    console.log("[TRACKER] sessão iniciada");
  }

  async function saveSession(reason = "auto") {
    if (saved || !startedAt) return;

    const ctx = getContext();
    if (!ctx || !ctx.item || !ctx.email) return;

    const watchedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    if (watchedSeconds < MIN_SECONDS) {
      console.log("[TRACKER] ignorado (<10s)");
      return;
    }

    saved = true;

    const payload = {
      email: ctx.email,
      tipo: ctx.item.tipo,
      filme_id: ctx.item.id || null,
      serie_nome: ctx.item.serie_nome || null,
      temporada: ctx.item.temporada || null,
      episodio: ctx.item.episodio || null,
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date().toISOString(),
      watched_seconds: watchedSeconds
    };

    console.log("[TRACKER] salvando sessão", payload);

    await sb.from("watch_sessions").insert(payload);
  }

  function bindVideo(video) {
    if (!video) return;

    // autoplay CONTA
    startSession();

    video.addEventListener("playing", startSession);

    // salva ao sair
    window.addEventListener("beforeunload", () => saveSession("unload"));

    // salva ao terminar
    video.addEventListener("ended", () => saveSession("ended"));
  }

  // observa quando o vídeo aparece
  const observer = new MutationObserver(() => {
    const video = document.querySelector("video");
    if (video) {
      observer.disconnect();
      bindVideo(video);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
