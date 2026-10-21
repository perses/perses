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

import type { ExploreTab } from '@perses-dev/explore';

import { LogsExplorer } from './LogsExplorer';

/** Tabs of the explore page: one per observability signal, each rendered by its Explore plugin. */
export function buildExploreTabs(projectName?: string): ExploreTab[] {
  return [
    { id: 'metrics', label: 'Metrics', explorerPluginName: 'PrometheusExplorer' },
    // The logs tab uses the app's logs explorer, which syncs a label explorer with the query.
    {
      id: 'logs',
      label: 'Logs',
      explorerPluginName: 'LogExplorer',
      content: <LogsExplorer projectName={projectName} />,
    },
    { id: 'traces', label: 'Traces', explorerPluginName: 'TempoExplorer' },
    { id: 'profiling', label: 'Profiling', explorerPluginName: 'PyroscopeExplorer' },
    { id: 'alerts', label: 'Alerts', explorerPluginName: 'AlertManagerAlertsExplorer' },
    { id: 'silences', label: 'Silences', explorerPluginName: 'AlertManagerSilencesExplorer' },
  ];
}
