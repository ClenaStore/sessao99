(async function () {
  // ================= CONFIG =================
  const SUPABASE_URL = "https://dxkszikemntfusfyrzos.supabase.co";
  const SUPABASE_KEY = "sb_publishable_NNFvdfSXgOdGGVcSbphbjQ_brC3_9ed";

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ================= HELPERS =================
  function getUsuario() {
    const email = localStorage.getItem("usuario_email");
    return email ? { email } : null;
  }

  function getVideo() {
    return document.querySelector("video");
  }

  function getItemAtual() {
    try {
      return window.heroItem || null;
    } catch {
      return null;
    }
  }

  // ================= PRESENÇA (ONLINE) =================
  setInterval(async () => {
    const user = getUsuario();
    if (!user) return;

    await sb.from("user_presence").upsert({
      user_id: user.email, // simplificado (pode trocar por UUID depois)
      email: user.email,
      page: location.pathname,
      last_seen: new Date().toISOString()
    });
  }, 20000);

  // ================= WATCH TRACKING =================
  let sessionStart = null;

  function bindVideo() {
    const video = getVideo();
    if (!video) return;

    video.addEventListener("play", () => {
      sessionStart = Date.now();
    });

    video.addEventListener("timeupdate", async () => {
      if (!video.duration) return;

      const percent = Math.floor(
        (video.currentTime / video.duration) * 100
      );

      if (percent % 10 !== 0) return;

      const user = getUsuario();
      const item = getItemAtual();
      if (!user || !item) return;

      await sb.from("watch_progress").upsert({
        email: user.email,
        tipo: item.tipo,
        filme_id: item.id,
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

      const video = getVideo();
      if (!video) return;

      const user = getUsuario();
      const item = getItemAtual();
      if (!user || !item) return;

      const watchedSeconds = Math.floor(
        (Date.now() - sessionStart) / 1000
      );

      await sb.from("watch_sessions").insert({
        email: user.email,
        tipo: item.tipo,
        filme_id: item.id,
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

  // ================= AUTO INIT =================
  const observer = new MutationObserver(bindVideo);
  observer.observe(document.body, { childList: true, subtree: true });
})();
