// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MARKETPLACE_SKILLS,
  MARKETPLACE_TOPICS,
  buildMarketplace,
  filterMarketplace,
  formatSkillCount,
  marketplaceSkill,
  marketplaceTopicCounts,
  parseCsv,
  type MarketplaceSkill,
} from './marketplace';

/**
 * The Library's catalog (CHAT-17; Chat Wave 4, W4-17): marketplace.json is
 * the import's CSV, its 701 MIT skills, meta data only (refresh: `yarn test
 * -u src/lib/chat/skills`). Its counts are the spec's, nothing from a
 * competitor is in it, and the cards' numbers read as the spec says.
 */

const REPO = path.resolve(__dirname, '../../../../..');
const CSV = readFileSync(path.join(REPO, 'skills/marketplace/SKILLS-CATALOG.csv'), 'utf8');
const JSON_TEXT = readFileSync(path.join(__dirname, 'marketplace.json'), 'utf8');
const rows = parseCsv(CSV).filter((row) => row.some((cell) => cell !== ''));
const header = rows[0];
const at = (name: string) => header.indexOf(name);
const imported = rows.slice(1).filter((row) => row[at('Status')] === 'Imported');

describe('marketplace.json', () => {
  it("is the CSV's Imported rows (refresh: yarn test -u src/lib/chat/skills)", async () => {
    await expect(`${JSON.stringify(buildMarketplace(CSV), null, 2)}\n`).toMatchFileSnapshot(
      './marketplace.json',
    );
  });

  it('holds the 701 MIT skills, each once, and no row on review or not imported', () => {
    expect(rows.length - 1).toBe(945);
    expect(imported).toHaveLength(701);
    expect(MARKETPLACE_SKILLS).toHaveLength(701);
    expect(new Set(MARKETPLACE_SKILLS.map((skill) => skill.id)).size).toBe(701);
    expect(MARKETPLACE_SKILLS.every((skill) => skill.license === 'MIT')).toBe(true);
    const listed = new Set(MARKETPLACE_SKILLS.map((skill) => skill.source.url));
    const left = rows.slice(1).filter((row) => row[at('Status')] !== 'Imported');
    expect(left).toHaveLength(244);
    expect(
      left.filter((row) => listed.has(row[at('SKILL.md source (pinned commit when imported)')])),
    ).toEqual([]);
  });

  it("has the spec's topic counts, and 14 skills under All only", () => {
    expect(marketplaceTopicCounts(MARKETPLACE_SKILLS)).toEqual({
      all: 701,
      seo: 94,
      content: 83,
      brand: 73,
      analytics: 32,
      social: 94,
      cro: 65,
      email: 53,
      'paid-ads': 44,
      growth: 85,
      gtm: 231,
    });
    expect(MARKETPLACE_SKILLS.filter((skill) => skill.topics.length === 0)).toHaveLength(14);
  });

  it('has installs for all but 2, and no security score from the directory (decision 10)', () => {
    expect(MARKETPLACE_SKILLS.filter((skill) => skill.installs === null)).toHaveLength(2);
    // The CSV has the directory's score for 245; the Library shows Ansvisor's own scan instead.
    expect(imported.filter((row) => row[at('skills.marketing security')] !== '')).toHaveLength(245);
    for (const skill of MARKETPLACE_SKILLS) {
      expect(Object.keys(skill), skill.id).not.toContain('safe');
      expect(Object.keys(skill), skill.id).not.toContain('security');
    }
    expect(JSON_TEXT).not.toContain('skills.marketing');
  });

  it('names no competitor: neither its repo, its adapted copywriting nor the word itself', () => {
    expect(
      MARKETPLACE_SKILLS.filter((skill) => skill.repo.startsWith('retieedra-profound/')),
    ).toEqual([]);
    expect(marketplaceSkill('coreyhaines31/marketingskills/copywriting')).toBeNull();
    expect(JSON_TEXT).not.toMatch(/profound/i);
  });

  it('pins every skill to a SKILL.md at a commit, with an id the database takes (00465)', () => {
    for (const skill of MARKETPLACE_SKILLS) {
      expect(skill.source.url, skill.id).toBe(
        `https://github.com/${skill.repo}/blob/${skill.source.commit}/${skill.source.path}`,
      );
      expect(skill.source.commit, skill.id).toMatch(/^[0-9a-f]{40}$/);
      expect(skill.source.path, skill.id).toMatch(/(^|\/)SKILL\.md$/);
      expect(skill.id.startsWith(`${skill.repo}/`), skill.id).toBe(true);
      // chat_skills.library_ref's check.
      expect(skill.id, skill.id).toMatch(/^[A-Za-z0-9._/-]{1,300}$/);
    }
  });

  it('marks the 8 skills to clean before they are shown or added (CHAT-17 item 15)', () => {
    const cleaned = Object.fromEntries(
      MARKETPLACE_SKILLS.filter((skill) => skill.cleanup).map((skill) => [skill.id, skill.cleanup]),
    );
    expect(cleaned).toEqual({
      'agricidaniel/claude-seo/seo': ['extension-line'],
      'agricidaniel/claude-seo/seo-geo': ['research-lines'],
      'coreyhaines31/marketingskills/ai-seo': ['research-lines'],
      'zubair-trabzada/geo-seo-claude/geo-brand-mentions': ['research-lines'],
      'gingiris-1031/gingiris-skills/b2b-marketing-playbook': ['promo-block'],
      'gingiris-1031/gingiris-skills/growth-hacking-playbook': ['promo-block'],
      'gingiris-1031/gingiris-skills/saas-growth-playbook': ['promo-block'],
      'gingiris-1031/gingiris-skills/startup-growth-playbook': ['promo-block'],
    });
  });

  it('keeps lines whole: a line the import cut ends at a sentence or a word', () => {
    for (const skill of MARKETPLACE_SKILLS) {
      expect(skill.description.length, skill.id).toBeGreaterThan(0);
      expect(skill.description.length, skill.id).toBeLessThanOrEqual(200);
      expect(skill.description, skill.id).not.toMatch(/ It gives the agent\b[^.]*$/);
    }
  });
});

describe('formatSkillCount', () => {
  it('reads as the cards show it (CHAT-17 item 6)', () => {
    expect(formatSkillCount(0)).toBe('0');
    expect(formatSkillCount(43)).toBe('43');
    expect(formatSkillCount(999)).toBe('999');
    expect(formatSkillCount(1000)).toBe('1K');
    expect(formatSkillCount(1400)).toBe('1.4K');
    expect(formatSkillCount(6900)).toBe('6.9K');
    expect(formatSkillCount(9949)).toBe('9.9K');
    expect(formatSkillCount(9960)).toBe('10K');
    expect(formatSkillCount(19154)).toBe('19K');
    expect(formatSkillCount(47826)).toBe('48K');
    expect(formatSkillCount(999_499)).toBe('999K');
    expect(formatSkillCount(999_500)).toBe('1M');
    expect(formatSkillCount(1_234_567)).toBe('1.2M');
  });
});

describe('filterMarketplace', () => {
  const skill = (over: Partial<MarketplaceSkill>): MarketplaceSkill => ({
    id: `o/r/${over.name ?? 'x'}`,
    name: 'x',
    description: '',
    repo: 'o/r',
    topics: [],
    stars: 0,
    installs: null,
    license: 'MIT',
    source: { url: '', commit: '', path: '' },
    ...over,
  });
  const a = skill({ name: 'Alpha', stars: 10, installs: 5, topics: ['seo'] });
  const b = skill({ name: 'Beta', stars: 10, installs: 50, topics: ['content'] });
  const c = skill({ name: 'Gamma', stars: 30, installs: null, repo: 'acme/schema-kit' });
  const d = skill({ name: 'Delta', stars: 1, installs: 50, description: 'FAQ Schema markup' });

  it('sorts by stars, then by installs with ties by stars and a missing count last', () => {
    expect(filterMarketplace([a, b, c, d]).map((s) => s.name)).toEqual([
      'Gamma',
      'Alpha',
      'Beta',
      'Delta',
    ]);
    expect(filterMarketplace([a, b, c, d], { sort: 'installs' }).map((s) => s.name)).toEqual([
      'Beta',
      'Delta',
      'Alpha',
      'Gamma',
    ]);
  });

  it('keeps one topic, and searches name, line and repo for every word', () => {
    expect(filterMarketplace([a, b, c, d], { topic: 'seo' })).toEqual([a]);
    expect(filterMarketplace([a, b, c, d], { query: 'schema' }).map((s) => s.name)).toEqual([
      'Gamma',
      'Delta',
    ]);
    expect(filterMarketplace([a, b, c, d], { query: 'faq SCHEMA' })).toEqual([d]);
    expect(filterMarketplace([a, b, c, d], { query: '  ' })).toHaveLength(4);
  });

  it('finds only skills that hold the word on the real catalog', () => {
    const found = filterMarketplace(MARKETPLACE_SKILLS, { query: 'schema' });
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) {
      expect(`${s.name} ${s.description} ${s.repo}`.toLowerCase()).toContain('schema');
    }
  });

  it('lists every topic in the chip order', () => {
    expect(MARKETPLACE_TOPICS).toEqual([
      'seo',
      'content',
      'brand',
      'analytics',
      'social',
      'cro',
      'email',
      'paid-ads',
      'growth',
      'gtm',
    ]);
  });
});

describe('parseCsv', () => {
  it('reads quoted commas, quotes and line breaks', () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\r\nx,,z\n')).toEqual([
      ['a', 'b, c', 'say "hi"', 'two\nlines'],
      ['x', '', 'z'],
    ]);
  });
});
