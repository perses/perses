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

/** Where the label explorer reads labels from, and which query it writes matchers into. */
export interface LabelSource {
  datasourceKind: 'PrometheusDatasource' | 'LokiDatasource';
  queryKind: 'TimeSeriesQuery' | 'LogQuery';
  queryPluginKind: 'PrometheusTimeSeriesQuery' | 'LokiLogQuery';
}

export interface ExploreSignal {
  id: string;
  label: string;
  /** Name of the Explore plugin rendering this signal. */
  explorerPluginName: string;
  labelSource?: LabelSource;
}

export const EXPLORE_SIGNALS: ExploreSignal[] = [
  {
    id: 'metrics',
    label: 'Metrics',
    explorerPluginName: 'PrometheusExplorer',
  },
  {
    id: 'logs',
    label: 'Logs',
    explorerPluginName: 'LogExplorer',
    labelSource: {
      datasourceKind: 'LokiDatasource',
      queryKind: 'LogQuery',
      queryPluginKind: 'LokiLogQuery',
    },
  },
  { id: 'traces', label: 'Traces', explorerPluginName: 'TempoExplorer' },
  { id: 'profiling', label: 'Profiling', explorerPluginName: 'PyroscopeExplorer' },
  { id: 'alerts', label: 'Alerts', explorerPluginName: 'AlertManagerAlertsExplorer' },
  { id: 'silences', label: 'Silences', explorerPluginName: 'AlertManagerSilencesExplorer' },
];

/** Explorer key used for a signal whose Explore plugin is not installed. */
export function getPlaceholderExplorerKey(signal: ExploreSignal): string {
  return `placeholder-${signal.id}`;
}
