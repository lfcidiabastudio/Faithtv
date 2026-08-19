let _data = { sundayName: "", wednesdayName: "", announcement: { enabled: false, type: "normal", text: "" } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") return res.status(200).json(_data);

  if (req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    try {
      const body = JSON.parse(raw || "{}");
      if (body.sundayName !== undefined) _data.sundayName = String(body.sundayName).slice(0, 80);
      if (body.wednesdayName !== undefined) _data.wednesdayName = String(body.wednesdayName).slice(0, 80);
      if (body.announcement !== undefined) _data.announcement = body.announcement;
      return res.status(200).json({ ok: true, data: _data });
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
