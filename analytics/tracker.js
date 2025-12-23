// analytics/tracker.js
(async () => {
  const SUPABASE_URL = "https://dxkszikemntfusfyrzos.supabase.co";
  const SUPABASE_KEY = "sb_publishable_NNFvdfSXgOdGGVcSbphbjQ_brC3_9ed";

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ================= CONTEXTO ================= */
  function getContext() {
    return window.__CLENA_CONTEXT__ || null;
  }

  function getUser() {
    const ctx = getContext();
    return ctx?.email ? { email: ctx.email } : null;
  }

  function getItem() {
    const ctx = getContext();
    return ctx?.item || null;
  }

  function getVideo() {
    const ctx = getContext();
    return ctx?.video || null;
  }

  /* ================= PRESENÇA ================= */
  async function heartbeat() {
    const user = getUser();
    if (!user) return;

    await sb.from("user_presence").upsert({
      email: user.email,
      page: location.pathname,
      last_seen: new Date().toISOString()
    });
  }

  heartbeat();
  setInterval(heartbeat, 15000);

  /* ================= WATCH TRACKING ================= */
  let lastPercentSent = -1;
  let sessionStart = null;

  function bindVideo() {
    const video = getVideo();
    if (!video) return;

    // ▶ PLAY
    video.addEventListener("play", () => {
      if (!sessionStart) {
        sessionStart = Date.now();
      }
    });

    // ⏱ PROGRESSO
    video.addEventListener("timeupdate", async () => {
      if (!video.duration) return;

      const percent = Math.floor(
        (video.currentTime / video.duration) * 100
      );

      // envia só a cada 10%
      if (percent % 10 !== 0 || percent === lastPercentSent) return;
      lastPercentSent = percent;

      const user = getUser();
      const item = getItem();
      if (!user || !item) return;

      await sb.from("watch_progress").upsert({
        email: user.email,
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

    // ⏹ SALVA SESSÃO
async function salvarSessao() {
  if (!sessionStart) return;

  const video = getVideo();
  if (!video) return;

  const user = getUsuario();
  const item = getItemAtual();
  if (!user || !item) return;

  const watchedSeconds = Math.floor(
    (Date.now() - sessionStart) / 1000
  );

  // ⛔ REGRA DE OURO: mínimo 10 segundos
  if (watchedSeconds < 10) {
    sessionStart = null;
    return;
  }

  await sb.from("watch_sessions").insert({
    email: user.email,
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

  /* ================= INIT ================= */
  const waitContext = setInterval(() => {
    if (getContext()?.video) {
      clearInterval(waitContext);
      bindVideo();
    }
  }, 300);
})();
