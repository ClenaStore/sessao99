export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { userId, fileBase64, mime } = req.body;

  if (!userId || !fileBase64) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const buffer = Buffer.from(fileBase64, "base64");

  const bunnyRes = await fetch(
    `https://storage.bunnycdn.com/sessao99/avatars/${userId}.jpg`,
    {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_KEY,
        "Content-Type": mime || "application/octet-stream"
      },
      body: buffer
    }
  );

  if (!bunnyRes.ok) {
    return res.status(500).json({ error: "Erro Bunny" });
  }

  return res.json({
    url: `https://sessao99.b-cdn.net/avatars/${userId}.jpg`
  });
}
