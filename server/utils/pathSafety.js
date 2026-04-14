import path from 'node:path';

const DANGEROUS_SEGMENTS = new Set(['..', '.', '__proto__', 'constructor', 'prototype']);

export function sanitizeRelativePath(input = '') {
  const value = String(input ?? '').trim().replace(/\\/g, '/');
  if (!value) {
    return '';
  }

  if (value.includes('\u0000')) {
    throw new Error('Path contains a null byte.');
  }

  const normalized = path.posix.normalize(value).replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);

  for (const segment of segments) {
    if (DANGEROUS_SEGMENTS.has(segment)) {
      throw new Error('Path escapes the allowed root.');
    }
  }

  return segments.join('/');
}

export function assertPathInsideRoot(rootDir, targetPath) {
  const relative = path.relative(rootDir, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Resolved path is outside the allowed root.');
  }

  return targetPath;
}

export function resolveSafeChildPath(rootDir, childPath = '') {
  const safeChildPath = sanitizeRelativePath(childPath);
  const resolvedPath = path.resolve(rootDir, safeChildPath);
  return assertPathInsideRoot(rootDir, resolvedPath);
}
