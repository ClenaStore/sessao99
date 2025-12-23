(async function () {
  const SUPABASE_URL = "https://dxkszikemntfusfyrzos.supabase.co";
  const SUPABASE_KEY = "sb_publishable_NNFvdfSXgOdGGVcSbphbjQ_brC3_9ed";
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function getContext() {
    return window.__CLENA_CONTEXT__ || null;
  }

  let sessionStart = null;
  let lastSaved = 0;

  function bindVideo() {
    const ctx = getContext();
    if (!ctx || !ctx.video || !ctx.item || !ctx.email) return;

    const video = ctx.video;
    const item = ctx.item;
    const email = ctx.email;

    if (video.__clenaBound) return;
    video.__clenaBound = true;

    // ▶ PLAY (autoplay conta)
    video.addEventListener("play", () => {
      sessionStart = Date.now();
    });

    // ⏱ PROGRESSO (a cada 10%)
    video.addEventListener("timeupdate", async () => {
      if (!video.duration) return;

      const percent = Math.floor(
        (video.currentTime / video.duration) * 100
      );

      if (percent % 10 !== 0) return;
      if (Date.now() - lastSaved < 5000) return;

      lastSaved = Date.now();

      await sb.from("watch_progress").upsert({
        email,
        tipo: item.tipo,
        filme_id: item.id || null,
        serie_nome: item.serie_nome || null,
        temporada: item.temporada || null,
        episodio: item.episodio || null,
        progress_percent: percent,
        passed_50: percent >= 50,
        updated_at: new Date().toISOString()
      });
    });

    async function salvarSessao() {
      if (!sessionStart) return;

      const watchedSeconds = Math.floor(
        (Date.now() - sessionStart) / 1000
      );

      // ⛔ mínimo 10 segundos
      if (watchedSeconds < 10) {
        sessionStart = null;
        return;
      }

      await sb.from("watch_sessions").insert({
        email,
        tipo: item.tipo,
        filme_id: item.id || null,
        serie_nome: item.serie_nome || null,
        temporada: item.temporada || null,
        episodio: item.episodio || null,
        started_at: new Date(sessionStart).toISOString(),
        ended_at: new Date().toISOString(),
        watched_seconds: watchedSeconds
      });

      sessionStart = null;
    }

    video.addEventListener("ended", salvarSessao);
    window.addEventListener("beforeunload", salvarSessao);
  }

  // Observa até o vídeo existir
  const observer = new MutationObserver(bindVideo);
  observer.observe(document.body, { childList: true, subtree: true });
})();
