import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAuthorProfile } from '../src/lib/authors';
import { getCachedXAvatarSrc, getInitialsAvatarSrc } from '../src/lib/avatars';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function repoPath(relativePath: string): string {
  return path.join(repoRoot, relativePath);
}

function readText(relativePath: string): string {
  return readFileSync(repoPath(relativePath), 'utf8');
}

function readBytes(relativePath: string): Buffer {
  return readFileSync(repoPath(relativePath));
}

describe('static public assets', () => {
  test('keeps legacy root logo aliases byte-for-byte with the canonical PNG logo', () => {
    const canonicalLogo = readBytes('public/openclaw-logo-text-dark.png');
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    expect(canonicalLogo.subarray(0, pngSignature.length).equals(pngSignature)).toBe(true);

    for (const alias of ['public/granola.png', 'public/logo.png']) {
      const bytes = readBytes(alias);

      expect(bytes.byteLength).toBeGreaterThan(0);
      expect(bytes.subarray(0, pngSignature.length).equals(pngSignature)).toBe(true);
      expect(bytes.equals(canonicalLogo)).toBe(true);
    }
  });

  test('keeps cached X avatar assets available for rendered testimonial pages', () => {
    const avatarDir = repoPath('public/avatars/x');

    expect(existsSync(repoPath('public/avatars/x/steipete.jpg'))).toBe(true);
    expect(existsSync(repoPath('public/avatars/x/wilcosx.jpg'))).toBe(true);
    expect(readdirSync(avatarDir).filter((file) => file.endsWith('.jpg')).length).toBeGreaterThan(
      200,
    );
    expect(statSync(avatarDir).isDirectory()).toBe(true);
  });

  test('keeps X avatar lookup on local cached assets before falling back', () => {
    expect(getCachedXAvatarSrc('@steipete')).toBe('/avatars/x/steipete.jpg');
    expect(resolveAuthorProfile({ name: 'Josh Avant' }).avatar).toBe('/avatars/x/joshavant.jpg');
    expect(getCachedXAvatarSrc('not-a-cached-profile', 'Missing Profile')).toBe(
      getInitialsAvatarSrc('Missing Profile'),
    );
  });

  test('keeps Google and X simple-icon assets wired into public pages', () => {
    const integrationsPage = readText('src/pages/integrations.astro');
    const homepage = readText('src/pages/index.astro');

    expect(integrationsPage).toContain("{ name: 'Google', icon: siIcon(siGoogle)");
    expect(integrationsPage).toContain("{ name: 'xAI', icon: siIcon(siX)");
    expect(integrationsPage).toContain("{ name: 'Twitter/X', icon: siIcon(siX)");
    expect(homepage).toContain("{ name: 'Twitter', icon: siIcon(siX)");
    expect(homepage).toContain("{ name: 'Browser', icon: siIcon(siGooglechrome)");
    expect(homepage).toContain("{ name: 'Gmail', icon: siIcon(siGmail)");
  });
});
