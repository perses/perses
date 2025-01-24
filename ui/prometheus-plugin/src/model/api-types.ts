// Copyright 2025 The Perses Authors
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

import { DurationString } from '@perses-dev/core';
import ASTNode from '../components/promql/ast';

// Just reuse dashboard model's type and re-export
export type { DurationString };

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  rawResponse?: Response;
  warnings?: string[];
}

export interface ErrorResponse<T> {
  status: 'error';
  data?: T;
  errorType: string;
  error: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse<T>;

export type DurationSeconds = number;

export type UnixTimestampSeconds = number;

export type ValueTuple = [unixTimeSeconds: UnixTimestampSeconds, sampleValue: string];

export type Metric = Record<string, string>;

export interface VectorData {
  resultType: 'vector';
  result: Array<{
    metric: Metric;
    value: ValueTuple;
  }>;
}

export interface MatrixData {
  resultType: 'matrix';
  result: Array<{
    metric: Metric;
    values: ValueTuple[];
  }>;
}

export interface ScalarData {
  resultType: 'scalar';
  result: ValueTuple;
}

export interface StringData {
  resultType: 'string';
  result: ValueTuple;
}

export interface InstantQueryRequestParameters {
  query: string;
  time?: UnixTimestampSeconds;
  timeout?: DurationString;
}

export type InstantQueryResultType = MatrixData | VectorData | ScalarData | StringData;

// Ref https://prometheus.io/docs/prometheus/latest/querying/api/#instant-queries
export type InstantQueryResponse = ApiResponse<InstantQueryResultType>;

export type MonitoredInstantQueryResponse = InstantQueryResponse & {
  responseTime: number;
};

export interface RangeQueryRequestParameters {
  query: string;
  start: UnixTimestampSeconds;
  end: UnixTimestampSeconds;
  step: DurationSeconds;
  timeout?: DurationString;
}

export type RangeQueryResponse = ApiResponse<MatrixData>;

export interface SeriesRequestParameters {
  'match[]': string[];
  start?: UnixTimestampSeconds;
  end?: UnixTimestampSeconds;
  limit?: number;
}

export type SeriesResponse = ApiResponse<Metric[]>;

export interface LabelNamesRequestParameters {
  start?: UnixTimestampSeconds;
  end?: UnixTimestampSeconds;
  'match[]'?: string[];
  limit?: number;
}

export type LabelNamesResponse = ApiResponse<string[]>;

export interface LabelValuesRequestParameters {
  labelName: string;
  start?: UnixTimestampSeconds;
  end?: UnixTimestampSeconds;
  'match[]'?: string[];
  limit?: number;
}

export type LabelValuesResponse = ApiResponse<string[]>;

export interface MetricMetadata {
  type: string;
  help: string;
  unit?: string;
}

export interface MetricMetadataRequestParameters {
  limit?: number;
  metric?: string;
}

export type MetricMetadataResponse = ApiResponse<Record<string, MetricMetadata[]>>;

// ref: https://prometheus.io/docs/prometheus/3.0/querying/api/#parsing-a-promql-expressions-into-a-abstract-syntax-tree-ast
export interface ParseQueryRequestParameters {
  query: string;
}

export type ParseQueryResponse = ApiResponse<ASTNode>;
