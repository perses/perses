// Copyright 2023 The Perses Authors
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

import { BuiltinVariableDefinition } from '@perses-dev/core';
import { DatasourcePlugin } from '@perses-dev/plugin-system';
import { instantQuery, rangeQuery, labelNames, labelValues, PrometheusClient } from '../model';
import { PrometheusDatasourceSpec } from './types';
import { PrometheusDatasourceEditor } from './PrometheusDatasourceEditor';

/**
 * Creates a PrometheusClient for a specific datasource spec.
 */
const createClient: DatasourcePlugin<PrometheusDatasourceSpec, PrometheusClient>['createClient'] = (spec, options) => {
  const { directUrl, proxy } = spec;
  const { proxyUrl } = options;

  // Use the direct URL if specified, but fallback to the proxyUrl by default if not specified
  const datasourceUrl = directUrl ?? proxyUrl;
  if (datasourceUrl === undefined) {
    throw new Error('No URL specified for Prometheus client. You can use directUrl in the spec to configure it.');
  }

  const specHeaders = proxy?.spec.headers;

  // Could think about this becoming a class, although it definitely doesn't have to be
  return {
    options: {
      datasourceUrl,
    },
    instantQuery: (params, headers) => instantQuery(params, { datasourceUrl, headers: headers ?? specHeaders }),
    rangeQuery: (params, headers) => rangeQuery(params, { datasourceUrl, headers: headers ?? specHeaders }),
    labelNames: (params, headers) => labelNames(params, { datasourceUrl, headers: headers ?? specHeaders }),
    labelValues: (params, headers) => labelValues(params, { datasourceUrl, headers: headers ?? specHeaders }),
  };
};

const getBuiltinVariableDefinitions: () => BuiltinVariableDefinition[] = () => {
  return [
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__interval',
        value: () => '$__interval', // will be overriden when time series query is called
        source: 'Prometheus',
        display: {
          name: '__interval',
          description:
            'Interval that can be used to group by time in queries. When there are more data points than can be shown on a graph then queries can be made more efficient by grouping by a larger interval.',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__interval_ms',
        value: () => '$__interval_ms', // will be overriden when time series query is called
        source: 'Prometheus',
        display: {
          name: '__interval_ms',
          description:
            'Interval in millisecond that can be used to group by time in queries. When there are more data points than can be shown on a graph then queries can be made more efficient by grouping by a larger interval.',
          hidden: true,
        },
      },
    },
    {
      kind: 'BuiltinVariable',
      spec: {
        name: '__rate_interval',
        value: () => '$__rate_interval', // will be overriden when time series query is called
        source: 'Prometheus',
        display: {
          name: '__rate_interval',
          description:
            "Interval at least four times the value of the scrape interval. It avoids problems specific to Prometheus when using 'rate' and 'increase' functions.",
          hidden: true,
        },
      },
    },
  ] as BuiltinVariableDefinition[];
};

export const PrometheusDatasource: DatasourcePlugin<PrometheusDatasourceSpec, PrometheusClient> = {
  createClient,
  getBuiltinVariableDefinitions,
  OptionsEditorComponent: PrometheusDatasourceEditor,
  createInitialOptions: () => ({ directUrl: '' }),
};
