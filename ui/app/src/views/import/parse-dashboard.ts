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
import { parseAllDocuments } from 'yaml';

import { getDashboardType } from './dashboard-type';

/** The parsed definition, or undefined when the definition is empty. */
export type Dashboard = GrafanaDashboard | PersesDashboard | InvalidDashboard | undefined;

interface GrafanaDashboard {
  kind: 'grafana';
  data: Record<string, unknown>;
}

interface PersesDashboard {
  kind: 'perses';
  data: DashboardResource;
}

/** A definition that can't be imported, with the reason to show to the user. */
interface InvalidDashboard {
  kind: 'invalid';
  message: string;
}

const ONE_AT_A_TIME = 'Import one dashboard at a time.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(message: string): InvalidDashboard {
  return { kind: 'invalid', message };
}

/**
 * Parse the given text as JSON, or else as YAML.
 * Returns undefined when it has no content, and an error message when it can't be parsed or holds several documents.
 */
function parseDefinition(definition: string): { value: unknown } | { error: string } | undefined {
  try {
    // JSON first: much faster than the YAML parser and keeps JSON semantics (e.g. duplicate keys, last one wins).
    return { value: JSON.parse(definition) };
  } catch {
    // Not JSON, try YAML below.
  }
  try {
    // merge: resolve the `<<` merge keys like percli does, while keeping the YAML 1.2 scalars (e.g. `on` stays a string).
    const documents = parseAllDocuments(definition, { merge: true });
    if (documents.some((doc) => doc.errors.length > 0)) {
      return { error: 'The definition is neither valid JSON nor valid YAML.' };
    }
    // Skip the empty documents, e.g. after a trailing `---`.
    const values = documents.map((doc) => doc.toJS()).filter((value) => value !== null && value !== undefined);
    if (values.length > 1) {
      return { error: `The definition contains ${values.length} YAML documents. ${ONE_AT_A_TIME}` };
    }
    return values.length === 0 ? undefined : { value: values[0] };
  } catch {
    // e.g. too many aliases.
    return { error: 'The definition is neither valid JSON nor valid YAML.' };
  }
}

/**
 * Parse a dashboard definition given as JSON or YAML.
 * Returns undefined when the definition is empty, and an invalid result with the reason when it can't be imported.
 */
export function parseDashboard(definition: string): Dashboard {
  const result = parseDefinition(definition);
  if (result === undefined) {
    return undefined;
  }
  if ('error' in result) {
    return invalid(result.error);
  }

  let value = result.value;
  // A list with a single dashboard, as printed by `percli get dashboards`.
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      return invalid(`The definition is a list of ${value.length} items. ${ONE_AT_A_TIME}`);
    }
    value = value[0];
  }
  if (!isRecord(value)) {
    return invalid('The definition must be a dashboard object.');
  }

  if (getDashboardType(value) === 'grafana') {
    return { kind: 'grafana', data: value };
  }
  if (value.kind === 'PersesDashboard') {
    return invalid(
      'PersesDashboard resources of the Perses operator are not supported. Import the Perses dashboard instead (kind Dashboard).',
    );
  }
  if (value.kind !== 'Dashboard') {
    return invalid(
      `Resources of kind ${JSON.stringify(value.kind)} can't be imported, only dashboards (kind Dashboard).`,
    );
  }
  if (!isRecord(value.metadata)) {
    return invalid('The dashboard has no metadata.');
  }
  return { kind: 'perses', data: value as unknown as DashboardResource };
}
