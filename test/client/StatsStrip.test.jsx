import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsStrip } from '../../src/components/StatsStrip.jsx';

describe('StatsStrip', () => {
  it('renders formatted overview metrics', () => {
    render(
      <StatsStrip
        metrics={{
          activeRuns: 12,
          failedRuns: 3,
          openApprovals: 4,
          policyFindings: 5,
          toolErrorRate: 0.125,
          totalCost: 27.34
        }}
      />
    );

    expect(screen.getByText('Active runs')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('13%')).toBeInTheDocument();
    expect(screen.getByText('$27.34')).toBeInTheDocument();
  });
});
