// Copyright 2024 The Perses Authors
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

import { DatasourceSelector } from '@perses-dev/core';

export type Operator = '=' | '!=' | '=~' | '!~';

export interface Settings {
  isMetadataEnabled: boolean;
  isPanelEnabled: boolean;
}

export interface FinderQueryParams {
  datasource?: DatasourceSelector;
  filters?: LabelFilter[];
  exploredMetric?: string;
}

export interface LabelFilter {
  label: string;
  labelValues: string[];
  operator: Operator;
}

export function computeFilterExpr(filters: LabelFilter[]): string {
  return `${filters.map((filter) => `${filter.label}${filter.operator}"${filter.labelValues.join('|')}"`).join(',')}`;
}

export interface LabelValueCounter {
  labelValue: string;
  counter: number;
}
