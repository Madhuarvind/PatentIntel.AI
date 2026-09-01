import { INITIAL_ORGANIZATIONS, type Organization } from '../data/organizations';

const STORAGE_KEY = 'patentintel_db_organizations';

export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

class OrganizationService {
  private organizations: Organization[] = [];

  constructor() {
    this.loadOrganizations();
  }

  private loadOrganizations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Organization[] = JSON.parse(stored);
        // Merge stored organizations with initial ones ensuring no duplicates
        const existingIds = new Set(parsed.map(o => o.id));
        const merged = [...parsed];
        INITIAL_ORGANIZATIONS.forEach(org => {
          if (!existingIds.has(org.id)) {
            merged.push(org);
          }
        });
        this.organizations = merged;
      } else {
        this.organizations = [...INITIAL_ORGANIZATIONS];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to load organizations from storage, fallback to defaults:', e);
      this.organizations = [...INITIAL_ORGANIZATIONS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.organizations));
    } catch (e) {
      console.error('Failed to persist organizations to storage:', e);
    }
  }

  public getAllOrganizations(): Organization[] {
    return [...this.organizations];
  }

  /**
   * Ranked Keyword & Fuzzy Search Matching
   */
  public searchOrganizations(query: string, maxResults: number = 8): Organization[] {
    const rawQuery = query.trim();
    if (!rawQuery) {
      // Return top organizations ordered by usage count when query is empty
      return [...this.organizations]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, maxResults);
    }

    const normQuery = normalizeText(rawQuery);
    const queryTokens = normQuery.split(' ').filter(Boolean);

    const scoredResults: { org: Organization; score: number }[] = [];

    this.organizations.forEach(org => {
      const normOfficial = normalizeText(org.officialName);
      const normShort = org.shortName ? normalizeText(org.shortName) : '';
      const normKeywords = org.keywords.map(k => normalizeText(k));
      const normCity = normalizeText(org.city || '');
      const normState = normalizeText(org.state || '');

      let score = 0;

      // 1. Exact official name match (Rank 1000)
      if (normOfficial === normQuery) {
        score += 1000;
      }
      // 2. Exact short name match (Rank 900)
      else if (normShort && normShort === normQuery) {
        score += 900;
      }
      // 3. Keyword exact match (Rank 800)
      else if (normKeywords.includes(normQuery)) {
        score += 800;
      }
      // 4. Starts with official name / short name (Rank 700)
      else if (normOfficial.startsWith(normQuery) || (normShort && normShort.startsWith(normQuery))) {
        score += 700;
      }
      // 5. Keyword starts with match (Rank 600)
      else if (normKeywords.some(k => k.startsWith(normQuery))) {
        score += 600;
      }
      // 6. Contains query substring (Rank 500)
      else if (normOfficial.includes(normQuery) || (normShort && normShort.includes(normQuery))) {
        score += 500;
      }
      // 7. Token-based matching (Rank 100-400)
      else {
        let tokenMatches = 0;
        queryTokens.forEach(token => {
          if (
            normOfficial.includes(token) ||
            normShort.includes(token) ||
            normKeywords.some(k => k.includes(token)) ||
            normCity.includes(token) ||
            normState.includes(token)
          ) {
            tokenMatches++;
          }
        });

        if (tokenMatches > 0) {
          score += tokenMatches * 100;
        }
      }

      // Add small boost for higher usage count and predefined trusted source
      if (score > 0) {
        score += Math.min(org.usageCount, 50);
        if (org.source === 'predefined') {
          score += 10;
        }
        scoredResults.push({ org, score });
      }
    });

    // Sort descending by score, then by usage count
    scoredResults.sort((a, b) => b.score - a.score || b.org.usageCount - a.org.usageCount);

    return scoredResults.slice(0, maxResults).map(r => r.org);
  }

  /**
   * Find existing canonical match or prevent duplicate
   */
  public findDuplicate(inputName: string): Organization | undefined {
    const normInput = normalizeText(inputName);
    if (!normInput) return undefined;

    return this.organizations.find(org => {
      const normOfficial = normalizeText(org.officialName);
      const normShort = org.shortName ? normalizeText(org.shortName) : '';
      if (normOfficial === normInput || (normShort && normShort === normInput)) {
        return true;
      }
      return org.keywords.some(k => normalizeText(k) === normInput);
    });
  }

  /**
   * Save a user-added organization with duplicate prevention
   */
  public saveUserOrganization(rawName: string): Organization {
    const trimmedName = rawName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      throw new Error('Organization name must be at least 3 characters long.');
    }

    // Check for existing duplicate first
    const existing = this.findDuplicate(trimmedName);
    if (existing) {
      this.incrementUsage(existing.id);
      return existing;
    }

    // Generate basic keywords from input name
    const tokens = trimmedName.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const keywords = Array.from(new Set([trimmedName.toLowerCase(), ...tokens]));

    const newOrg: Organization = {
      id: `org_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      officialName: trimmedName,
      shortName: null,
      keywords,
      city: 'Custom',
      state: 'User Added',
      type: 'College',
      source: 'user_added',
      usageCount: 1,
      createdAt: new Date().toISOString(),
      isVerified: false
    };

    this.organizations.unshift(newOrg);
    this.saveToStorage();
    return newOrg;
  }

  /**
   * Increment usage count for selected organization
   */
  public incrementUsage(id: string): void {
    const target = this.organizations.find(o => o.id === id);
    if (target) {
      target.usageCount = (target.usageCount || 0) + 1;
      this.saveToStorage();
    }
  }
}

export const organizationService = new OrganizationService();
