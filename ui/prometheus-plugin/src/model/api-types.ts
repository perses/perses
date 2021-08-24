import { DurationString } from '@perses-ui/core';

// Just reuse dashboard model's type and re-export
export type { DurationString };

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
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

export type ValueTuple = [
  unixTimeSeconds: UnixTimestampSeconds,
  sampleValue: string
];

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

export interface InstantQueryRequestParameters {
  query: string;
  time?: UnixTimestampSeconds;
  timeout?: DurationString;
}

export type InstantQueryResponse = ApiResponse<
  MatrixData | VectorData | ScalarData
>;

export interface RangeQueryRequestParameters {
  query: string;
  start: UnixTimestampSeconds;
  end: UnixTimestampSeconds;
  step: DurationSeconds;
  timeout?: DurationString;
}

export type RangeQueryResponse = ApiResponse<MatrixData>;

export interface SeriesRequestParameters {
  match: string[];
  start: UnixTimestampSeconds;
  end: UnixTimestampSeconds;
}

export type SeriesResponse = ApiResponse<Metric[]>;

export interface LabelNamesRequestParameters {
  start?: UnixTimestampSeconds;
  end?: UnixTimestampSeconds;
  match?: string[];
}

export type LabelNamesResponse = ApiResponse<string[]>;

export interface LabelValuesRequestParameters {
  labelName: string;
  start?: UnixTimestampSeconds;
  end?: UnixTimestampSeconds;
  match?: string[];
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

export type MetricMetadataResponse = ApiResponse<
  Record<string, MetricMetadata[]>
>;
