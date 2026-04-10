export default async function handler(req, res) {
  // CORSの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');


  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }


  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    res.status(400).json({ error: 'API key required' });
    return;
  }


  try {
    const { messages, max_tokens } = req.body;
    
    // 💡 魔法の1行：フロントエンドが何を要求しても、強制的に Gemini 1.5 Flash に書き換える！
    const targetModel = 'gemini-1.5-flash';


    // 1. Anthropic形式 → Gemini形式の変換
    const contents = messages.map(m => {
      const parts = m.content.map(c => {
        if (c.type === 'text') {
          return { text: c.text };
        } else if (c.type === 'image') {
          return {
            inline_data: {
              mime_type: c.source.media_type,
              data: c.source.data
            }
          };
        }
        return {};
      });
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });


    // 2. Gemini API へ送信
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: max_tokens || 2048,
          temperature: 0.7
        }
      }),
    });


    const result = await response.json();


    if (!response.ok) {
      throw new Error(result.error?.message || 'Gemini API Error');
    }


    // 3. フロントエンド（index.html）が読み取れる形式に戻して返す
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({
      content: [{ type: 'text', text: textResponse }]
    });


  } catch (e) {
    console.error('Backend Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
