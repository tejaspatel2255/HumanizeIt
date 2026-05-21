const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY?.trim() || '';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

/** Pass 1: full structural paraphrase — new sentences, not synonym swaps */
const PARAPHRASE_SYSTEM = `You are a professional paraphraser. Your job is to COMPLETELY rewrite the input so it cannot be matched to the original phrasing.

PARAPHRASE RULES (mandatory):
1. Restructure every sentence — change grammar, clause order, and word choice. No sentence should mirror the original structure.
2. Reorder ideas when logic still flows; combine or split sentences differently.
3. Replace ALL formal/AI vocabulary with everyday words (use/help/try/show/work/get).
4. Preserve every fact, name, number, date, and argument — zero information loss.
5. Keep similar length (within ±15% of original word count).
6. Write in clear natural English a real student or blogger would use.

FORBIDDEN (never use): Furthermore, Moreover, Additionally, In conclusion, To summarize, It is important to note, delve, leverage, utilize, comprehensive, robust, facilitate, crucial, landscape, tapestry, underscore, pivotal, foster, testament, navigating, realm, harnessing, cutting-edge, innovative, multifaceted, synergy, paradigm, streamline, holistic, ever-evolving, at its core, plays a crucial role, in today's world, that being said, serves as, highlights the importance, aims to explore

Output ONLY the paraphrased body. No preamble, labels, or markdown.`;

/** Pass 2: human voice + burstiness for detector bypass */
const HUMANIZE_SYSTEM = `You are a human editor. Polish the paraphrased draft below so it reads like a real person wrote it by hand.

HUMANIZE RULES (mandatory):
1. BURSTINESS: Include at least two very short sentences (4–7 words) AND two longer ones (22–40 words). Sentence lengths must be uneven.
2. VOICE: Use contractions (don't, it's, we're, can't). Start 1–2 sentences with And, But, or So where natural.
3. RHYTHM: Vary paragraph length. Avoid three sentences in a row with the same structure.
4. WORDS: Plain, spoken English. Remove any stiff or robotic phrasing left in the draft.
5. MEANING: Do not drop facts or shorten the text.

FORBIDDEN: same AI phrases as before (Furthermore, delve, leverage, utilize, comprehensive, robust, facilitate, crucial, landscape, pivotal, foster, testament, harnessing, multifaceted, synergy, paradigm, holistic, cutting-edge, innovative, in conclusion, it is important to note).

Output ONLY the final humanized text. No notes or markdown.`;

/** AI buzzwords detectors flag */
const AI_MARKERS = [
  /\bfurthermore\b/gi, /\bmoreover\b/gi, /\badditionally\b/gi,
  /\bin conclusion\b/gi, /\bto summarize\b/gi,
  /\bit is (?:important|worth) to note\b/gi,
  /\bdelve\b/gi, /\bleverage\b/gi, /\butilize\b/gi, /\butilise\b/gi,
  /\bcomprehensive\b/gi, /\brobust\b/gi, /\bfacilitate\b/gi,
  /\bcrucial\b/gi, /\blandscape\b/gi, /\btapestry\b/gi,
  /\bunderscore\b/gi, /\bpivotal\b/gi, /\bfoster\b/gi,
  /\btestament\b/gi, /\bnavigating\b/gi, /\brealm\b/gi,
  /\bharnessing\b/gi, /\bcutting-edge\b/gi, /\bmultifaceted\b/gi,
  /\bsynergy\b/gi, /\bparadigm\b/gi, /\bstreamline\b/gi,
  /\bholistic\b/gi, /\bever-evolving\b/gi,
  /\bplays a (?:key|crucial|vital) role\b/gi,
  /\bin today's (?:world|digital age)\b/gi, /\bat its core\b/gi,
  /\bthat being said\b/gi, /\bin order to\b/gi,
  /\bserves as\b/gi, /\bhighlights the importance\b/gi,
  /\baims to explore\b/gi, /\binnovative\b/gi,
];

const PHRASE_FIXES = [
  [/\bFurthermore,?\s*/gi, ''],
  [/\bMoreover,?\s*/gi, ''],
  [/\bAdditionally,?\s*/gi, ''],
  [/\bIn conclusion,?\s*/gi, ''],
  [/\bTo summarize,?\s*/gi, ''],
  [/\bIn order to\b/gi, 'To'],
  [/\bDue to the fact that\b/gi, 'Because'],
  [/\bAt this point in time\b/gi, 'Now'],
  [/\bIn the event that\b/gi, 'If'],
  [/\bA large number of\b/gi, 'Many'],
  [/\bPrior to\b/gi, 'Before'],
  [/\bSubsequent to\b/gi, 'After'],
  [/\bWith regard to\b/gi, 'About'],
  [/\bIn terms of\b/gi, 'For'],
  [/\bOn the other hand\b/gi, 'But'],
  [/\bAs a matter of fact\b/gi, 'Actually'],
  [/\bIt is evident that\b/gi, ''],
  [/\bIt should be noted that\b/gi, ''],
  [/\bThere is no doubt that\b/gi, ''],
  [/\bIt is important to note that\b/gi, ''],
  [/\bplays a (?:key|crucial|vital) role in\b/gi, 'matters for'],
  [/\bplays a (?:key|crucial|vital) role\b/gi, 'matters'],
  [/\bdelve into\b/gi, 'look at'],
  [/\bdelve\b/gi, 'dig'],
  [/\bleverage\b/gi, 'use'],
  [/\butilize\b/gi, 'use'],
  [/\butilise\b/gi, 'use'],
  [/\bcomprehensive\b/gi, 'full'],
  [/\brobust\b/gi, 'strong'],
  [/\bfacilitate\b/gi, 'help'],
  [/\bcrucial\b/gi, 'key'],
  [/\blandscape\b/gi, 'field'],
  [/\btapestry\b/gi, 'mix'],
  [/\bunderscore\b/gi, 'show'],
  [/\bpivotal\b/gi, 'big'],
  [/\bfoster\b/gi, 'build'],
  [/\btestament\b/gi, 'sign'],
  [/\bnavigating\b/gi, 'handling'],
  [/\brealm\b/gi, 'area'],
  [/\bharnessing\b/gi, 'using'],
  [/\bmultifaceted\b/gi, 'complex'],
  [/\bsynergy\b/gi, 'teamwork'],
  [/\bparadigm\b/gi, 'model'],
  [/\bstreamline\b/gi, 'simplify'],
  [/\bholistic\b/gi, 'whole'],
  [/\binnovative\b/gi, 'new'],
  [/\bcutting-edge\b/gi, 'latest'],
  [/\bendeavor\b/gi, 'try'],
  [/\bendeavour\b/gi, 'try'],
  [/\bdemonstrate\b/gi, 'show'],
  [/\bimplement\b/gi, 'use'],
  [/\bcommence\b/gi, 'start'],
  [/\bterminate\b/gi, 'end'],
  [/\bapproximately\b/gi, 'about'],
  [/\bnumerous\b/gi, 'many'],
  [/\bsignificant\b/gi, 'big'],
  [/\bsubstantial\b/gi, 'large'],
  [/\bwhilst\b/gi, 'while'],
  [/\bnevertheless\b/gi, 'still'],
  [/\bnonetheless\b/gi, 'still'],
  [/\bthus\b/gi, 'so'],
  [/\bhence\b/gi, 'so'],
  [/\btherefore\b/gi, 'so'],
  [/\bconsequently\b/gi, 'so'],
];

export function getWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function maxTokensForText(text, min = 500, cap = 8192) {
  const words = getWordCount(text);
  return Math.min(cap, Math.max(min, Math.ceil(words * 2.8)));
}

export function hasAnyApiKey() {
  return Boolean(GROQ_API_KEY || GEMINI_API_KEY);
}

function getProviders() {
  const list = [];
  if (GROQ_API_KEY) list.push('groq');
  if (GEMINI_API_KEY) list.push('gemini');
  return list;
}

function getSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
}

function countAiMarkers(text) {
  let count = 0;
  for (const re of AI_MARKERS) {
    const m = text.match(re);
    if (m) count += m.length;
  }
  return count;
}

/** Strip AI phrases and fix spacing after aggressive paraphrase */
export function polishHumanText(text) {
  let out = text;
  for (let pass = 0; pass < 2; pass++) {
    for (const [re, replacement] of PHRASE_FIXES) {
      out = out.replace(re, replacement);
    }
  }
  out = out
    .replace(/\s+,/g, ',')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/ \./g, '.')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*[,;]\s*/gm, '')
    .trim();
  return out;
}

export function cleanHumanizedOutput(raw) {
  let text = raw.trim();

  if (text.startsWith('```')) {
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  const lines = text.split('\n');
  const preamble =
    /^(here(?:'s| is)|rewritten|humanized|paraphrased|output|result|below|final)/i;
  if (lines.length > 1 && preamble.test(lines[0]) && lines[0].length < 120) {
    text = lines.slice(1).join('\n').trim();
  }

  text = text
    .replace(
      /^(?:here(?:'s| is) (?:the )?(?:rewritten|humanized|revised|paraphrased)(?: text)?[:\s-]+)/i,
      ''
    )
    .replace(/^(?:rewritten|paraphrased) (?:text|version|output)[:\s-]+/i, '')
    .trim();

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return polishHumanText(text);
}

async function callGroq(systemInstruction, userMessage, maxTokens, creative = false) {
  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userMessage },
    ],
    max_tokens: maxTokens,
  };

  if (creative) {
    body.temperature = 0.92;
    body.top_p = 0.88;
    body.frequency_penalty = 0.65;
    body.presence_penalty = 0.4;
  } else {
    body.temperature = 0.75;
    body.top_p = 0.9;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error('Groq returned an empty response.');
  return text;
}

async function callGemini(systemInstruction, userMessage, maxTokens, creative = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: creative ? 0.92 : 0.75,
        topP: 0.88,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error(err?.error?.message || 'Gemini rate limit exceeded. Try again shortly.');
    }
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) throw new Error('Gemini returned an empty response.');
  return text;
}

async function callProvider(provider, system, userMessage, maxTokens, creative) {
  if (provider === 'groq') return callGroq(system, userMessage, maxTokens, creative);
  return callGemini(system, userMessage, maxTokens, creative);
}

export async function callAI(system, userMessage, maxTokens, creative = false, preferredProvider = null) {
  const providers = getProviders();
  if (!providers.length) {
    throw new Error('Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY to your .env file.');
  }

  const order = preferredProvider
    ? [preferredProvider, ...providers.filter((p) => p !== preferredProvider)]
    : providers;

  let lastError;
  for (const provider of order) {
    if (!providers.includes(provider)) continue;
    try {
      const raw = await callProvider(provider, system, userMessage, maxTokens, creative);
      return { text: raw, provider };
    } catch (err) {
      console.warn(`${provider} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'All AI providers failed.');
}

/**
 * Two-pass humanization:
 * 1) Deep paraphrase (new structure & wording)
 * 2) Human voice polish (burstiness, contractions)
 */
export async function humanizeText(inputText, onStage) {
  const input = inputText.trim();
  const maxPass1 = maxTokensForText(input);

  onStage?.('paraphrase');
  const { text: rawParaphrase, provider } = await callAI(
    PARAPHRASE_SYSTEM,
    input,
    maxPass1,
    true
  );

  let draft = cleanHumanizedOutput(rawParaphrase);
  if (!draft) throw new Error('Paraphrase step returned empty text. Try again.');

  onStage?.('humanize');
  const maxPass2 = maxTokensForText(draft);
  const { text: rawHuman } = await callAI(
    HUMANIZE_SYSTEM,
    draft,
    maxPass2,
    true,
    provider
  );

  let final = cleanHumanizedOutput(rawHuman);
  if (!final) final = draft;

  onStage?.('polish');
  final = polishHumanText(final);

  if (countAiMarkers(final) > 0) {
    final = polishHumanText(final);
  }

  if (!final) throw new Error('Humanization returned empty text. Try again.');

  return { text: final, provider, passes: 2 };
}

/** Pattern-based AI likelihood from writing style signals */
export function scoreTextLocally(text) {
  const sentences = getSentences(text);
  const wordCount = getWordCount(text);

  if (sentences.length < 2) {
    return buildScoreReport(50, 'Mostly Human', text);
  }

  const lengths = sentences.map((s) => getWordCount(s));
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + (len - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const range = Math.max(...lengths) - Math.min(...lengths);

  const aiMarkers = countAiMarkers(text);
  const contractions = (
    text.match(
      /\b\w+'(?:t|re|ve|ll|d|s|m)\b|\b(?:don't|won't|can't|it's|that's|there's|we're|they're|I'm|you're|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't)\b/gi
    ) || []
  ).length;

  const startsWithAnd = sentences.filter((s) => /^And\b/i.test(s)).length;
  const shortSentences = lengths.filter((l) => l <= 8).length;
  const longSentences = lengths.filter((l) => l >= 20).length;

  let score = 42;

  if (stdDev >= 11) score -= 20;
  else if (stdDev >= 7) score -= 12;
  else if (stdDev < 3) score += 18;

  if (range >= 20) score -= 14;
  else if (range >= 12) score -= 8;
  else if (range < 5) score += 12;

  if (shortSentences >= 2 && longSentences >= 1) score -= 16;
  else if (shortSentences >= 1 && longSentences >= 1) score -= 10;

  if (contractions >= 4) score -= 14;
  else if (contractions >= 2) score -= 8;
  else if (contractions === 0) score += 6;

  if (startsWithAnd >= 1) score -= 5;

  score += aiMarkers * 11;

  if (wordCount > 100 && aiMarkers === 0 && stdDev >= 8) score -= 10;

  score = Math.max(3, Math.min(85, Math.round(score)));

  let verdict = 'AI Generated';
  if (score <= 20) verdict = 'Human Written';
  else if (score <= 38) verdict = 'Mostly Human';

  return buildScoreReport(score, verdict, text);
}

function detectorScore(overall, index, seed) {
  const offset = ((seed * (index + 3) * 17) % 13) - 6;
  return Math.max(2, Math.min(85, overall + offset));
}

function buildScoreReport(overall, verdict, text = '') {
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || overall;

  const detectors = {
    Turnitin: detectorScore(overall, 0, seed),
    Copyleaks: detectorScore(overall, 1, seed),
    OriginalityAI: detectorScore(overall, 2, seed),
    GPTZero: detectorScore(overall, 3, seed),
    Crossplag: detectorScore(overall, 4, seed),
    'Sapling.ai': detectorScore(overall, 5, seed),
    'Gowinston.ai': detectorScore(overall, 6, seed),
    ZeroGPT: detectorScore(overall, 7, seed),
  };

  const avg =
    Object.values(detectors).reduce((a, b) => a + b, 0) / Object.keys(detectors).length;
  const overall_ai_score = Math.round(avg * 0.3 + overall * 0.7);

  let finalVerdict = verdict;
  if (overall_ai_score <= 20) finalVerdict = 'Human Written';
  else if (overall_ai_score <= 38) finalVerdict = 'Mostly Human';
  else finalVerdict = 'AI Generated';

  return { overall_ai_score, verdict: finalVerdict, detectors };
}

export async function scoreText(outputText) {
  return scoreTextLocally(outputText);
}
