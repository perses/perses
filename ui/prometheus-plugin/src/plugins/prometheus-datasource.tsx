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
import {
  healthCheck,
  instantQuery,
  rangeQuery,
  labelNames,
  labelValues,
  PrometheusClient,
  metricMetadata,
  series,
  parseQuery,
} from '../model';
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
    healthCheck: healthCheck({ datasourceUrl, headers: specHeaders }),
    instantQuery: (params, headers) => instantQuery(params, { datasourceUrl, headers: headers ?? specHeaders }),
    rangeQuery: (params, headers) => rangeQuery(params, { datasourceUrl, headers: headers ?? specHeaders }),
    labelNames: (params, headers) => labelNames(params, { datasourceUrl, headers: headers ?? specHeaders }),
    labelValues: (params, headers) => labelValues(params, { datasourceUrl, headers: headers ?? specHeaders }),
    metricMetadata: (params, headers) => metricMetadata(params, { datasourceUrl, headers: headers ?? specHeaders }),
    series: (params, headers) => series(params, { datasourceUrl, headers: headers ?? specHeaders }),
    parseQuery: (params, headers) => parseQuery(params, { datasourceUrl, headers: headers ?? specHeaders }),
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
            'For dynamic queries that adapt across different time ranges, use $__interval instead of hardcoded intervals. It represents the actual spacing between data points: it’s calculated based on the current time range and the panel pixel width (taking the "Min step" as a lower bound).',
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
          description: 'Same as $__interval but in milliseconds.',
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
            'Use this one rather than $__interval as the range parameter of functions like rate, increase, etc. With such function it is advised to choose a range that is at least 4x the scrape interval (this is to allow for various races, and to be resilient to a failed scrape). $__rate_interval provides that, as it is defined as `max($__interval + Min Step, 4 * Min Step)`, where Min Step value should represent the scrape interval of the metrics.',
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
