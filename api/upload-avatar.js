export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { userId, fileBase64, mime } = req.body;

  if (!userId || !fileBase64) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  // 🔑 CREDENCIAL FIXA (TEMPORÁRIO, COMO VOCÊ PEDIU)
  const BUNNY_KEY = "d498d56e-361b-4a1e-9edb9eb63e3b-2e6a-4c17";
  const BUNNY_STORAGE = "https://storage.bunnycdn.com/sessao99";
  const BUNNY_PULL = "https://sessao99.b-cdn.net";

  const buffer = Buffer.from(fileBase64, "base64");

  const bunnyRes = await fetch(
    `${BUNNY_STORAGE}/avatars/${userId}.jpg`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_KEY,
        "Content-Type": mime || "application/octet-stream"
      },
      body: buffer
    }
  );

  if (!bunnyRes.ok) {
    const text = await bunnyRes.text();
    console.error("Erro Bunny:", text);

    return res.status(500).json({
      error: "Erro Bunny",
      detail: text
    });
  }

  return res.json({
    url: `${BUNNY_PULL}/avatars/${userId}.jpg`
  });
}
