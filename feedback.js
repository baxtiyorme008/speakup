module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'API key not configured' });

  const { studentName, answers } = req.body;
  if (!answers || !answers.length) return res.status(400).json({ error: 'No answers provided' });

  const IELTS_SYS = `You are a certified IELTS Speaking examiner with 15 years of experience. Evaluate the candidate's answers against the official IELTS Speaking band descriptors for all 4 criteria:
1. Fluency & Coherence (FC)
2. Lexical Resource (LR)
3. Grammatical Range & Accuracy (GRA)
4. Pronunciation (P)
Band descriptors: 4=very limited, 5=noticeable limitations, 6=generally effective, 7=flexible and accurate, 8=precise and natural, 9=completely natural.
Return ONLY valid JSON: {"overall_band":<number>,"criteria":{"fluency_coherence":{"band":<number>,"feedback":"<text>"},"lexical_resource":{"band":<number>,"feedback":"<text>"},"grammatical_range":{"band":<number>,"feedback":"<text>"},"pronunciation":{"band":<number>,"feedback":"<text>"}},"per_answer":[{"index":<int>,"strengths":"<text>","areas_to_improve":"<text>","band_estimate":<number>}],"overall_comment":"<text>","top_tips":["<tip1>","<tip2>","<tip3>"]}`;

  const content = answers.map((a, i) =>
    `Answer ${i+1} (Part ${a.part})\nQuestion: ${a.qText}\nStudent: ${a.transcript}`
  ).join('\n\n---\n\n');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: IELTS_SYS }, { role: 'user', content: `Candidate: ${studentName}\n\n${content}` }],
      temperature: 0.25,
      response_format: { type: 'json_object' }
    })
  });

  if (!groqRes.ok) return res.status(groqRes.status).json({ error: await groqRes.text() });
  const data = await groqRes.json();
  return res.status(200).json(JSON.parse(data.choices[0].message.content));
};
