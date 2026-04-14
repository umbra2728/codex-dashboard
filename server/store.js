import { EventEmitter } from 'node:events';
import { buildDashboardViews } from './selectors.js';
import { createEmptySnapshot, normalizeDashboardData, pickSnapshotSlices, SLICE_NAMES } from './utils/normalizers.js';

export function createDashboardStore({ mode = 'mock' } = {}) {
  const emitter = new EventEmitter();
  let snapshot = createEmptySnapshot();
  let revision = 0;
  let generatedAt = new Date().toISOString();
  let views = buildDashboardViews(snapshot, { generatedAt, mode });

  function hydrate(rawData = {}, { changed = SLICE_NAMES, reason = 'hydrate' } = {}) {
    snapshot = normalizeDashboardData(rawData);
    generatedAt = rawData.generatedAt || new Date().toISOString();
    revision += 1;
    views = buildDashboardViews(snapshot, { generatedAt, mode });

    const update = {
      revision,
      generatedAt,
      mode,
      reason,
      changed,
      snapshot: pickSnapshotSlices(snapshot, changed),
      views
    };

    emitter.emit('update', update);
    return update;
  }

  return {
    hydrate,
    getSnapshot() {
      return snapshot;
    },
    getViews() {
      return views;
    },
    getMeta() {
      return { revision, generatedAt, mode };
    },
    getBootstrapPayload() {
      return {
        revision,
        generatedAt,
        mode,
        snapshot,
        views
      };
    },
    subscribe(listener) {
      emitter.on('update', listener);
      return () => emitter.off('update', listener);
    }
  };
}
