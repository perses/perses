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

import { Metadata } from '../../shared/model/api/v1/metadata.model';
import { HeaderModel } from '../../shared/model/api/v1/kind.model';

export interface Rule {
  record?: string;
  alert?: string;
  expr: string;
  for?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface RuleGroup {
  name: string;
  internal: string;
  rules: Rule[];
}

export interface PrometheusRuleSpec {
  groups: RuleGroup[];
}

export interface PrometheusRuleModel extends HeaderModel {
  metadata: Metadata;
  spec: PrometheusRuleSpec;
}
