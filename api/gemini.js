export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = 'tunedModels/academic-mentor-vjhii67cxs45';
  
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        }
      );
  
      const data = await geminiResponse.json();
      res.status(200).json(data);
    } catch (err) {
      console.error('Gemini error:', err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }
  