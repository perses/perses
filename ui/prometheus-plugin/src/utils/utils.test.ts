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

import { Metric } from '../model/api-types';
import { formatSeriesName, getFormattedPrometheusSeriesName, getUniqueKeyForPrometheusResult } from './utils';

describe('formatSeriesName', () => {
  it('should resolve label name tokens to label values from query response', () => {
    // example from query: node_load15{instance=~\"(demo.do.prometheus.io:9100)\",job='$job'}
    const inputFormat = 'Test {{job}} {{instance}}';

    const metric = {
      __name__: 'node_load15',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };

    const output = 'Test node demo.do.prometheus.io:9100';

    expect(formatSeriesName(inputFormat, metric)).toEqual(output);
  });
});

describe('getUniqueKeyForPrometheusResult', () => {
  let labels: { [key: string]: string } = {};
  beforeEach(() => {
    labels = {};
  });

  it('should be a formatted prometheus string', () => {
    labels = { ['foo']: 'bar' };
    const result = getUniqueKeyForPrometheusResult(labels);
    expect(result).toEqual('{foo="bar"}');
  });

  it('should be formatted with "', () => {
    labels = { ['foo']: 'bar' };
    const result = getUniqueKeyForPrometheusResult(labels, { removeExprWrap: true });
    expect(result).toEqual('{"foo":"bar"}');
  });

  it('should be formatted with __name__ removed', () => {
    labels = {
      __name__: 'node_memory_Buffers_bytes',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };
    const result = getUniqueKeyForPrometheusResult(labels, { removeExprWrap: true });
    expect(result).toEqual('{"env":"demo","instance":"demo.do.prometheus.io:9100","job":"node"}');
  });

  it('should return a valid query to filter by label', () => {
    labels = {
      __name__: 'node_memory_Buffers_bytes',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };
    const result = getUniqueKeyForPrometheusResult(labels, { removeExprWrap: false });
    expect(result).toEqual('node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}');
  });
});

describe('getFormattedPrometheusSeriesName', () => {
  it('should resolve empty metric to instead show query', () => {
    const query = 'node_load15{instance=~"(demo.do.prometheus.io:9100)"';
    const metric = {};
    const output = { name: '{}', formattedName: '{}' };
    expect(getFormattedPrometheusSeriesName(query, metric)).toEqual(output);
  });

  it('should show a metric with empty labels with the appropriate seriesNameFormat', () => {
    const query = 'up';
    const metric = {};
    const seriesNameFormat = 'Custom series name';
    const output = { name: '{}', formattedName: 'Custom series name' };
    expect(getFormattedPrometheusSeriesName(query, metric, seriesNameFormat)).toEqual(output);
  });

  it('should show correct formatted series name when labels are populated', () => {
    const query = 'node_load15{instance=~"(demo.do.prometheus.io:9100)"';
    const metric = {
      __name__: 'node_memory_Buffers_bytes',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };
    const seriesNameFormat = 'custom example {{env}} {{instance}} {{job}}';
    const output = {
      formattedName: 'custom example demo demo.do.prometheus.io:9100 node',
      name: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    };
    expect(getFormattedPrometheusSeriesName(query, metric, seriesNameFormat)).toEqual(output);
  });

  it('should show an empty string when no corresponding label values returned', () => {
    const query = 'test_query';
    const metric = {
      job: 'node',
    };
    const seriesNameFormat = 'test{{fake}}';
    const output = {
      formattedName: 'test',
      name: '{job="node"}',
    };
    expect(getFormattedPrometheusSeriesName(query, metric, seriesNameFormat)).toEqual(output);
  });

  it('should correctly handle invalid label value case', () => {
    const query = 'test_query';
    const metric = {
      job: 99,
    };
    const seriesNameFormat = 'job - {{job}}';
    const output = {
      formattedName: 'job - 99',
      name: '{job="99"}',
    };
    expect(getFormattedPrometheusSeriesName(query, metric as unknown as Metric, seriesNameFormat)).toEqual(output);
  });

  it('should show correct raw series name', () => {
    const query = 'node_load15{instance=~"(demo.do.prometheus.io:9100)"';
    const metric = {
      __name__: 'node_memory_Buffers_bytes',
      env: 'demo',
      instance: 'demo.do.prometheus.io:9100',
      job: 'node',
    };
    const output = {
      name: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
      formattedName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    };
    expect(getFormattedPrometheusSeriesName(query, metric, undefined)).toEqual(output);
  });
});
