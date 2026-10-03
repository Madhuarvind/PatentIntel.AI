import type { Version } from '../pilotTypes';
export const views = ['dashboard', 'proposals', 'sources', 'reviews', 'reports', 'settings'] as const;
export type View = typeof views[number];
export function parsePilotRoute(hash: string) {
  const clean = hash.replace(/^#\/?/, '').replace(/^pilot\/?/, '');
  const [view, id = '', version = ''] = clean.split('/');
  return { view: views.includes(view as View) ? view as View : 'dashboard' as View, id, version };
}
export function pilotHash(view: View, id = '', version = '') {
  return `#/pilot/${view}${id ? `/${id}${version ? `/${version}` : ''}` : ''}`;
}
export function selectedVersion(versions: Version[], requested: string) {
  return requested ? versions.find(version => version.id === requested) : versions[0];
}
