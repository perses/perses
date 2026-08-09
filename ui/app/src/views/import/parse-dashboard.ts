import { DashboardResource } from '@perses-dev/client';
import { parse } from 'yaml';

type DashboardType = 'grafana' | 'perses';
export type Dashboard = GrafanaDashboard | PersesDashboard | undefined;

interface GrafanaDashboard {
  kind: 'grafana';
  data: Record<string, unknown>;
}

interface PersesDashboard {
  kind: 'perses';
  data: DashboardResource;
}

export function getDashboardType(dashboard: unknown): DashboardType | undefined {
  if (typeof dashboard !== 'object' || dashboard === null) {
    return undefined;
  }

  if ('kind' in dashboard) {
    return 'perses';
  } else {
    return 'grafana';
  }
}

export function parseDashboard(data: string | undefined): Dashboard | undefined {
  try {
    const value = parse(data ?? '{}');
    const type = getDashboardType(value);

    switch (type) {
      case 'grafana':
        return { kind: 'grafana', data: value };
      case 'perses':
        return { kind: 'perses', data: value };
      default:
        return undefined;
    }
  } catch (_) {
    return undefined;
  }
}
