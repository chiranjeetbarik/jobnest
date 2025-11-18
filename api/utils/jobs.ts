import { normalizeText } from './nlp.ts';

export function normalizeJob(job: any) {
  return {
    ...job,
    title: normalizeText(job?.title || ''),
    company: normalizeText(job?.company || ''),
    location: normalizeText(job?.location || ''),
    description: normalizeText(job?.description || ''),
  };
}

export function dedupeKey(job: any): string {
  // Simple near-duplicate key using normalized title + company + location
  const t = (job?.title || '').toLowerCase().trim();
  const c = (job?.company || '').toLowerCase().trim();
  const l = (job?.location || '').toLowerCase().trim();
  return `${t}|${c}|${l}`;
}
