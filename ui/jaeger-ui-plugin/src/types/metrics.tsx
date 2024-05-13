// Copyright (c) 2021 The Jaeger Authors.
//
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

/* eslint-disable camelcase */

import { ApiError } from './api-error';

export type MetricsType = 'latencies' | 'calls' | 'errors';
export type AvailableServiceMetrics = 'service_call_rate' | 'service_latencies' | 'service_error_rate';
export type AvailableOpsMetrics =
  | 'service_operation_call_rate'
  | 'service_operation_latencies'
  | 'service_operation_error_rate';

export type spanKinds = 'unspecified' | 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export type MetricsAPIQueryParams = {
  quantile: number;
  groupByOperation?: boolean;
  endTs: number;
  lookback: number;
  step: number;
  ratePer: number;
  spanKind: spanKinds;
};

export type LableObject = {
  name: string;
  value: string;
};

export type MetricPointObject = {
  gaugeValue: {
    doubleValue: number;
  };
  timestamp: string;
};

export type MetricObject = {
  labels: LableObject[];
  metricPoints: MetricPointObject[];
};

export type MetricsAPIServiceResponseData<T = AvailableServiceMetrics, U = 0.95> = {
  name: T;
  type: 'GAUGE';
  help: string;
  metrics: MetricObject[];
  quantile: U;
};

export type MetricsAPIOpsResponseData<T = AvailableOpsMetrics> = {
  name: T;
  type: 'GAUGE';
  help: string;
  metrics: MetricObject[];
  quantile: number;
};

export type Points = {
  x: number;
  y: number | null;
};

export type DataAvg = {
  service_operation_call_rate: null | number;
  service_operation_error_rate: null | number;
  service_operation_latencies: null | number;
};

export type OpsDataPoints = {
  service_operation_call_rate: Points[];
  service_operation_error_rate: Points[];
  service_operation_latencies: Points[];
  avg: DataAvg;
};

export type ServiceOpsMetrics = {
  dataPoints: OpsDataPoints;
  errRates: number;
  impact: number;
  latency: number;
  name: string;
  requests: number;
  key: number;
};

export type ServiceMetricsObject = {
  serviceName: string;
  quantile: number;
  max: number;
  metricPoints: Points[];
};

export type ServiceMetrics = {
  service_latencies: null | ServiceMetricsObject[];
  service_call_rate: null | ServiceMetricsObject;
  service_error_rate: null | ServiceMetricsObject;
};

export type MetricsReduxState = {
  serviceError: {
    service_latencies_50: null | ApiError;
    service_latencies_75: null | ApiError;
    service_latencies_95: null | ApiError;
    service_call_rate: null | ApiError;
    service_error_rate: null | ApiError;
  };
  opsError: {
    opsLatencies: null | ApiError;
    opsCalls: null | ApiError;
    opsErrors: null | ApiError;
  };
  isATMActivated: null | boolean;
  loading: boolean;
  operationMetricsLoading: null | boolean;
  serviceMetrics: ServiceMetrics | null;
  serviceOpsMetrics: ServiceOpsMetrics[] | undefined;
};

export enum PromiseStatus {
  fulfilled = 'fulfilled',
  rejected = 'rejected',
}

export type PromiseFulfilledResult<T> = {
  status: PromiseStatus.fulfilled;
  value: T;
};

export type PromiseRejectedResult = {
  status: PromiseStatus.rejected;
  reason: ApiError;
};

export type FetchedAllServiceMetricsResponse = [
  PromiseFulfilledResult<MetricsAPIServiceResponseData<'service_latencies', 0.5>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIServiceResponseData<'service_latencies', 0.75>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIServiceResponseData<'service_latencies'>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIServiceResponseData<'service_call_rate'>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIServiceResponseData<'service_error_rate'>> | PromiseRejectedResult,
];

export type FetchAggregatedServiceMetricsResponse = [
  PromiseFulfilledResult<MetricsAPIOpsResponseData<'service_operation_latencies'>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIOpsResponseData<'service_operation_call_rate'>> | PromiseRejectedResult,
  PromiseFulfilledResult<MetricsAPIOpsResponseData<'service_operation_error_rate'>> | PromiseRejectedResult,
];
