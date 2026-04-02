module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'API key not configured' });

  const { studentName, answers } = req.body;
  if (!answers || !answers.length) return res.status(400).json({ error: 'No answers provided' });

  // ── SYSTEM PROMPT: Strict holistic IELTS examiner ────────────────────────
  const IELTS_SYS = `You are a strict, experienced IELTS Speaking examiner trained by the British Council. Your job is to assess a candidate's performance holistically across all their answers — exactly as a real IELTS examiner would during an official test.

You will receive the full transcript of a candidate's IELTS Speaking test (Parts 1, 2, and 3). You must assess performance across the four official IELTS criteria ONLY ONCE, at the end of the full test. Do NOT score individual answers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each criterion is scored on the official IELTS band scale: 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0.

The OVERALL band score = average of the 4 criteria scores, rounded to the nearest 0.5.

Default to the LOWER band if you are unsure between two scores. Do not award a band unless the candidate clearly and consistently demonstrates its descriptors throughout the test.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFFICIAL BAND DESCRIPTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FLUENCY & COHERENCE (FC)
- 9.0 — Speaks with complete fluency. Hesitation is content-related only, not linguistic. Coherence is effortless.
- 8.0 — Fluent with only minor hesitation. Fully coherent, well-sequenced ideas with only rare repetition.
- 7.0 — Able to speak at length with minimal effort. Some hesitation or repetition present but does not impede communication. Ideas logically sequenced.
- 6.0 — Willing to speak at length but loses coherence at times due to hesitation, repetition, or self-correction. Connective devices used but not always cohesively.
- 5.0 — Usually maintains flow but frequent hesitation and repetition. Short responses with limited development in Part 2 and 3.
- 4.0 — Responses are often short with little development. Frequent pauses, hesitation, and loss of coherence.

LEXICAL RESOURCE (LR)
- 9.0 — Full flexibility. Uses vocabulary with full naturalness, precision, and idiomatic control. Rare minor slips only.
- 8.0 — Wide range of vocabulary, used fluently and flexibly. Occasional minor inaccuracies. Effective use of uncommon/idiomatic language.
- 7.0 — Uses vocabulary flexibly to discuss a variety of topics. Some less common items used accurately. Occasional minor errors in word choice or collocation.
- 6.0 — Adequate range for the tasks. Generally effective but with some inaccuracies or over-reliance on common vocabulary. Limited paraphrasing ability.
- 5.0 — Limited range. Repetitive vocabulary. Errors in word choice may cause occasional strain on the listener.
- 4.0 — Very limited range. Only basic vocabulary with frequent errors that obscure meaning.

GRAMMATICAL RANGE & ACCURACY (GRA)
- 9.0 — Full range of structures used with consistent accuracy. Errors are extremely rare and minor.
- 8.0 — Wide range of structures used flexibly. Majority of sentences are error-free. Only occasional slips.
- 7.0 — Uses a variety of complex structures. Frequently error-free. Some errors occur in complex forms but do not impede communication.
- 6.0 — Mix of simple and complex forms. Some complex structures attempted but with errors. Generally accurate in simple forms.
- 5.0 — Uses a limited range of structures. Complex structures attempted with frequent errors. Basic sentences mostly accurate.
- 4.0 — Only basic sentence forms with limited accuracy. Errors frequently cause communication problems.

PRONUNCIATION (PR)
- 9.0 — Uses full range of phonological features with ease and precision. L1 accent has no effect on intelligibility.
- 8.0 — Wide range of phonological features used effectively. Accent does not affect intelligibility. Only minor slips.
- 7.0 — Phonological features generally used well. L1 accent occasionally affects production. Listener requires minimal effort.
- 6.0 — Generally clear. Requires some listener effort. Mispronunciation of some words or sounds.
- 5.0 — Mispronunciation is noticeable and occasionally causes misunderstanding. Limited range of phonological features.
- 4.0 — Pronunciation often unclear. Heavy L1 accent. Listener must work hard to understand.

PRONUNCIATION NOTE: Only a transcript is available — no audio. Score Pronunciation based on observable signals ONLY: word-level errors suggesting phonological confusion, non-standard patterns reflecting L1 interference. Do NOT assume good pronunciation just because the transcript reads fluently. Always state the score is estimated from transcript only. For Uzbek L1 speakers, common issues include vowel reduction and consonant cluster simplification — apply appropriate scrutiny.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PER-ANSWER FEEDBACK (NO BAND SCORES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each individual answer provide ONLY:
- One specific strength (cite actual words or phrases the candidate used)
- One specific improvement (actionable, not generic)

Do NOT assign band scores to individual answers. Individual scores are inaccurate and misleading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No markdown. No preamble. No text outside the JSON.

{
  "overall_band": <number e.g. 6.5>,
  "overall_comment": "<3-4 sentences: overall level, what they do well, single most important area to improve>",
  "criteria": {
    "fluency_coherence": {
      "band": <number e.g. 7.0>,
      "feedback": "<2-3 sentences with specific transcript evidence>"
    },
    "lexical_resource": {
      "band": <number e.g. 7.0>,
      "feedback": "<2-3 sentences citing specific vocabulary items>"
    },
    "grammatical_range": {
      "band": <number e.g. 6.0>,
      "feedback": "<2-3 sentences citing specific structures and errors>"
    },
    "pronunciation": {
      "band": <number e.g. 6.0>,
      "feedback": "<2 sentences — must state this is estimated from transcript only>"
    }
  },
  "per_answer": [
    {
      "index": <0-based integer>,
      "strengths": "<1-2 sentences citing actual words or phrases used>",
      "areas_to_improve": "<1-2 sentences, specific and actionable>"
    }
  ],
  "top_tips": [
    "<specific actionable tip 1 based on their actual performance>",
    "<specific actionable tip 2 based on their actual performance>",
    "<specific actionable tip 3 based on their actual performance>"
  ]
}`;

  // ── Build full transcript for holistic assessment ─────────────────────────
  const fullTranscript = answers.map((a, i) =>
    `Answer ${i + 1} (Part ${a.part})\nQuestion: ${a.qText}\nTranscript: "${a.transcript}"`
  ).join('\n\n---\n\n');

  const userMessage = `Candidate name: ${studentName}

Please evaluate the following IELTS Speaking test responses holistically:

${fullTranscript}`;

  // ── Call Groq API ─────────────────────────────────────────────────────────
  let groqRes;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: IELTS_SYS },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach Groq API', detail: err.message });
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return res.status(groqRes.status).json({ error: 'Groq API error', detail: errText });
  }

  const data = await groqRes.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  // ── Parse JSON safely ─────────────────────────────────────────────────────
  let parsed;
  try {
    const clean = rawText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse scoring response', raw: rawText });
  }

  return res.status(200).json(parsed);
};
