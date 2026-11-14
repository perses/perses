// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { DashboardResource } from '@perses-dev/client';
import { parse } from 'yaml';

import { getDashboardType } from './dashboard-type';

export type Dashboard = GrafanaDashboard | PersesDashboard | undefined;

interface GrafanaDashboard {
  kind: 'grafana';
  data: Record<string, unknown>;
}

interface PersesDashboard {
  kind: 'perses';
  data: DashboardResource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse a dashboard definition given as JSON or YAML.
 * Returns undefined when the definition is invalid or isn't an object.
 */
export function parseDashboard(definition: string): Dashboard {
  let value: unknown;
  try {
    // JSON first: much faster than yaml.parse and keeps JSON semantics (e.g. duplicate keys, last one wins).
    value = JSON.parse(definition);
  } catch {
    try {
      // logLevel 'error' avoids a console.warn for each YAML warning (e.g. unresolved tags).
      value = parse(definition, { logLevel: 'error' });
    } catch {
      return undefined;
    }
  }
  if (!isRecord(value)) {
    return undefined;
  }

  if (getDashboardType(value) === 'perses') {
    return { kind: 'perses', data: value as unknown as DashboardResource };
  }
  return { kind: 'grafana', data: value };
}
