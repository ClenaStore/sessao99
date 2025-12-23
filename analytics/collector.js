// analytics/collector.js
(() => {

  if (!window.supabase || !window.video) return;

  const sb = window.supabase.createClient(
    "https://dxkszikemntfusfyrzos.supabase.co",
    "sb_publishable_NNFvdfSXgOdGGVcSbphbjQ_brC3_9ed"
  );

  const email = localStorage.getItem("usuario_email");
  if (!email) return;

  let sessionId = null;
  let heartbeat = null;

  function getItemMeta() {
    try {
      return JSON.parse(
        decodeURIComponent(
          new URLSearchParams(location.search).get("item")
        )
      );
    } catch {
      return null;
    }
  }

  const item = getItemMeta();
  if (!item) return;

  /* ▶ START SESSION */
  async function startSession() {
    const { data } = await sb
      .from("watch_sessions")
      .insert({
        email,
        tipo: item.tipo,
        filme_id: item.id || null,
        serie_nome: item.serie_nome || null,
        temporada: item.temporada || null,
        episodio: item.episodio || null,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!data) return;
    sessionId = data.id;

    await sb.from("user_presence").upsert({
      email,
      status: "assistindo",
      last_seen: new Date().toISOString()
    });

    heartbeat = setInterval(sendHeartbeat, 15000);
  }

  /* ⏱ HEARTBEAT */
  async function sendHeartbeat() {
    if (!sessionId || !window.video?.duration) return;

    const percent =
      (window.video.currentTime / window.video.duration) * 100;

    if (percent < 5) return;

    await sb.from("watch_progress").upsert({
      session_id: sessionId,
      progress_percent: Math.floor(percent),
      updated_at: new Date().toISOString()
    });

    await sb.from("user_presence").upsert({
      email,
      status: "assistindo",
      last_seen: new Date().toISOString()
    });
  }

  /* ⏹ END SESSION */
  async function endSession() {
    clearInterval(heartbeat);

    if (sessionId) {
      await sb
        .from("watch_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    await sb
      .from("user_presence")
      .update({ status: "offline" })
      .eq("email", email);
  }

  /* EVENTS */
  window.video.addEventListener("play", startSession, { once: true });
  window.addEventListener("beforeunload", endSession);
  window.video.addEventListener("ended", endSession);

})();
