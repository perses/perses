// Copyright 2021 Amadeus s.a.s
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

import { DashboardSection, DashboardVariable } from './dashboard.model';

export interface VariableFeedRequest {
  datasource: string;
  duration: string;
  variables: Record<string, DashboardVariable>;
  selected_variables?: Record<string, string>;
  previous_selected_variables?: Record<string, string>;
}

export interface VariableFeedResponse {
  name: string;
  selected: string;
  values: string [];
  err?: string;
}

/*
 * These interfaces are used to map the section feeds information received from
 * the backend.
 */

type PrometheusResultType = {
  matrix: PromMatrix,
  vector: PromVector,
};

type PermutationPrometheusResult<T> = {
  [K in keyof T]: {
    type: K;
    result: T[K][];
    err?: string;
  }
}[keyof T];

export interface PromMatrix {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface PromVector {
  metric: Record<string, string>;
  value: [number, string];
}

export interface PanelFeedResponse {
  name: string;
  order: number;
  feeds: PermutationPrometheusResult<PrometheusResultType>[];
}

export interface SectionFeedResponse {
  name: string;
  order: number;
  panels: PanelFeedResponse[];
}

export interface SectionFeedRequest {
  datasource: string;
  duration: string;
  variables?: Record<string, string>;
  sections: Record<string, DashboardSection>;
}
