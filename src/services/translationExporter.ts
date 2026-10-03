import type { ClaimTranslationSession } from '../types';

export function createTranslationExport(session: ClaimTranslationSession, format: 'txt' | 'json') {
  if (!session.translated_text?.trim()) throw new Error('Translate a claim before exporting.');
  const content = format === 'json' ? JSON.stringify(session, null, 2) : [
    'PatentIntel.AI — Claim Translation Working Draft',
    'Review the translation against the original source before use.',
    '', 'Original claim', session.original_text,
    '', 'Translated claim', session.translated_text,
  ].join('\n');
  return { content, mimeType: format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    filename: `claim-translation.${format}` };
}
