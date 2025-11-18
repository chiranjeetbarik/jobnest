export const STOPWORDS = new Set<string>([
  'a','an','the','and','or','but','if','then','else','for','of','on','in','to','with','by','at','from','as','is','are','was','were','be','been','being','this','that','these','those','it','its','into','over','under','about','your','you','we','our','their','they'
]);

export function normalizeText(text: string): string {
  return (text || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  const cleaned = normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]+/g, ' ');
  return cleaned.split(/\s+/).filter(t => t && !STOPWORDS.has(t));
}

export function buildTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

export function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, a2 = 0, b2 = 0;
  const allKeys = new Set([...a.keys(), ...b.keys()]);
  for (const k of allKeys) {
    const av = a.get(k) || 0;
    const bv = b.get(k) || 0;
    dot += av * bv;
    a2 += av * av;
    b2 += bv * bv;
  }
  if (a2 === 0 || b2 === 0) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}
