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

import { DurationString, HTTPProxy } from '@perses-dev/core';
import { PrometheusDatasourceSelector } from '../model';

export const DEFAULT_SCRAPE_INTERVAL: DurationString = '1m';

export interface PrometheusDatasourceSpec {
  directUrl?: string;
  proxy?: HTTPProxy;
  scrapeInterval?: DurationString; // default to 1m
}

export interface PrometheusVariableOptionsBase {
  datasource?: PrometheusDatasourceSelector;
}

export type PrometheusLabelNamesVariableOptions = PrometheusVariableOptionsBase & {
  matchers?: string[];
};

export type PrometheusLabelValuesVariableOptions = PrometheusVariableOptionsBase & {
  labelName: string;
  matchers?: string[];
};

export type PrometheusPromQLVariableOptions = PrometheusVariableOptionsBase & {
  // expr is the PromQL expression.
  expr: string;
  // labelName is the name of the label that will be used after the PromQL query is performed to select the label value.
  // Note: This field is not part of the Prometheus API.
  labelName: string;
};
