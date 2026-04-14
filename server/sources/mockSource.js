import { mockDashboardData } from '../../test/fixtures/mock-dashboard-data.js';
import { SLICE_NAMES } from '../utils/normalizers.js';

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function createMockSource({ fixture = mockDashboardData } = {}) {
  return {
    async start(onUpdate) {
      onUpdate({
        data: clone(fixture),
        changed: [...SLICE_NAMES],
        reason: 'mock:init'
      });
    },
    async stop() {
      return undefined;
    }
  };
}
