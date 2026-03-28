export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'API key not configured' });

  const { studentName, answers } = req.body;
  if (!answers || !answers.length) return res.status(400).json({ error: 'No answers provided' });

  const IELTS_SYS = `You are a certified IELTS Speaking examiner with 15 years of experience. Evaluate the candidate's answers against the official IELTS Speaking band descriptors for all 4 criteria:

1. Fluency & Coherence (FC): flow of speech, use of discourse markers, logical organisation, coherence of ideas
2. Lexical Resource (LR): vocabulary range, accuracy, collocations, idioms, paraphrase ability
3. Grammatical Range & Accuracy (GRA): range of structures, frequency and impact of grammatical errors
4. Pronunciation (P): clarity, word stress, rhythm, intonation, intelligibility (estimated from lexical and syntactic patterns)

Band descriptors:
Band 4: very limited, many errors, hard to follow
Band 5: noticeable limitations, frequent errors, limited vocabulary
Band 6: generally effective, some errors, adequate vocabulary
Band 7: flexible and accurate, occasional minor errors, good range
Band 8: precise and natural, very few errors, wide range
Band 9: completely natural, near-native fluency

Return ONLY valid JSON (no markdown, no extra text):
{
  "overall_band": <number e.g. 6.5>,
  "criteria": {
    "fluency_coherence": {"band":<number>,"feedback":"<2-3 specific sentences>"},
    "lexical_resource":  {"band":<number>,"feedback":"<2-3 specific sentences>"},
    "grammatical_range": {"band":<number>,"feedback":"<2-3 specific sentences>"},
    "pronunciation":     {"band":<number>,"feedback":"<2-3 specific sentences>"}
  },
  "per_answer":[
    {"index":<0-based>,"strengths":"<1-2 sentences>","areas_to_improve":"<1-2 sentences>","band_estimate":<number>}
  ],
  "overall_comment":"<3-4 sentences summarising performance and main strengths>",
  "top_tips":["<actionable tip 1>","<actionable tip 2>","<actionable tip 3>"]
}`;

  const content = answers.map((a, i) =>
    `Answer ${i + 1} (Part ${a.part})\nQuestion: ${a.qText}\nStudent: ${a.transcript}`
  ).join('\n\n---\n\n');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: IELTS_SYS },
        { role: 'user', content: `Candidate: ${studentName}\n\n${content}` }
      ],
      temperature: 0.25,
      response_format: { type: 'json_object' }
    })
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return res.status(groqRes.status).json({ error: err });
  }

  const data = await groqRes.json();
  const result = JSON.parse(data.choices[0].message.content);
  return res.status(200).json(result);
}
