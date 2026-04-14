import fs from 'node:fs/promises';
import path from 'node:path';
import chokidar from 'chokidar';
import { resolveSafeChildPath } from '../utils/pathSafety.js';
import { SLICE_NAMES } from '../utils/normalizers.js';

const FILE_MAP = {
  workspaces: ['workspaces.json', 'workspaces.jsonl'],
  runs: ['runs.json', 'runs.jsonl'],
  sessions: ['sessions.json', 'sessions.jsonl'],
  toolCalls: ['toolCalls.json', 'toolCalls.jsonl'],
  approvals: ['approvals.json', 'approvals.jsonl'],
  policyEvents: ['policyEvents.json', 'policyEvents.jsonl'],
  usageSamples: ['usageSamples.json', 'usageSamples.jsonl'],
  sourceHealth: ['sourceHealth.json', 'sourceHealth.jsonl']
};

async function getSafeFileStats(candidatePath) {
  try {
    const stats = await fs.lstat(candidatePath);
    if (stats.isSymbolicLink()) {
      throw new Error('Symlinked watched files are not allowed.');
    }
    return stats;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function readJsonFile(filePath, sliceName) {
  const content = await fs.readFile(filePath, 'utf8');
  if (!content.trim()) {
    return [];
  }

  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed[sliceName])) {
    return parsed[sliceName];
  }

  return [];
}

async function readJsonlFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  if (!content.trim()) {
    return [];
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function readSlice(dataDir, sliceName) {
  for (const fileName of FILE_MAP[sliceName]) {
    const safePath = resolveSafeChildPath(dataDir, fileName);
    const stats = await getSafeFileStats(safePath);
    if (!stats?.isFile()) {
      continue;
    }

    if (fileName.endsWith('.jsonl')) {
      return readJsonlFile(safePath);
    }

    return readJsonFile(safePath, sliceName);
  }

  return [];
}

function withSourceHealth(data, dataDir, status, detail) {
  const sourceHealth = Array.isArray(data.sourceHealth) ? [...data.sourceHealth] : [];
  const adapterHealth = {
    id: 'source-file-adapter',
    workspaceId: 'global',
    source: 'file',
    label: 'File adapter',
    category: 'adapter',
    status,
    detail,
    lagMs: 0,
    updatedAt: new Date().toISOString()
  };

  const existingIndex = sourceHealth.findIndex((item) => item.id === adapterHealth.id);
  if (existingIndex === -1) {
    sourceHealth.unshift(adapterHealth);
  } else {
    sourceHealth.splice(existingIndex, 1, adapterHealth);
  }

  return {
    ...data,
    sourceHealth,
    generatedAt: new Date().toISOString()
  };
}

async function readAllData(dataDir) {
  const result = { generatedAt: new Date().toISOString() };
  for (const sliceName of SLICE_NAMES) {
    result[sliceName] = await readSlice(dataDir, sliceName);
  }
  return result;
}

function inferSliceName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return SLICE_NAMES.includes(basename) ? basename : null;
}

export function createFileSource({ dataDir, watch }) {
  let watcher;
  let debounceTimer;
  let lastData = withSourceHealth({}, dataDir, 'warning', 'Watching for normalized files.');
  const pendingSlices = new Set();

  async function emitCurrentData(onUpdate, changed, reason) {
    try {
      const nextData = await readAllData(dataDir);
      lastData = withSourceHealth(nextData, dataDir, 'healthy', `Watching ${dataDir} for JSON and JSONL updates.`);
      onUpdate({ data: lastData, changed, reason });
    } catch (error) {
      lastData = withSourceHealth(lastData, dataDir, 'error', error.message);
      onUpdate({ data: lastData, changed: ['sourceHealth'], reason: 'file:error' });
    }
  }

  return {
    async start(onUpdate) {
      await fs.mkdir(dataDir, { recursive: true });
      await emitCurrentData(onUpdate, [...SLICE_NAMES], 'file:init');

      watcher = chokidar.watch(dataDir, {
        ...watch,
        ignoreInitial: true
      });

      watcher.on('all', (_eventName, filePath) => {
        const sliceName = inferSliceName(filePath);
        pendingSlices.add(sliceName || 'sourceHealth');
        pendingSlices.add('sourceHealth');

        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
          const changed = [...pendingSlices];
          pendingSlices.clear();
          await emitCurrentData(onUpdate, changed, 'file:update');
        }, 150);
      });
    },
    async stop() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (watcher) {
        await watcher.close();
      }
    }
  };
}
