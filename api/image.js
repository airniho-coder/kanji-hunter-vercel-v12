export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-stability-key');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const stabilityKey = req.headers['x-stability-key'];
  if (!stabilityKey) { res.status(400).json({ error: 'Stability key required' }); return; }

  try {
    const { prompt } = req.body;
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('negative_prompt', 'headless, no face, face cut off, body only, cropped head, missing head, back view, rear view, faceless, blur face, obscured face, covered face, helmet covering face, mask covering face, nsfw, nude, extra fingers, six fingers, too many fingers, deformed hands, extra limbs, malformed limbs');
    form.append('output_format', 'webp');
    form.append('aspect_ratio', '2:3');
    form.append('style_preset', 'anime');

    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stabilityKey}`,
        'Accept': 'image/*',
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    res.status(200).json({ image: 'data:image/webp;base64,' + base64 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
