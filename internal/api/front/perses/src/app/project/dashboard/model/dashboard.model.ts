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

import { ProjectMetadata } from '../../../shared/model/api/v1/metadata.model';
import { HeaderModel } from '../../../shared/model/api/v1/kind.model';

type ParametersType = {
  PromqlQuery: PromQLQueryVariableParameter
  Constant: ConstantVariableParameter
  LabelValuesQuery: LabelValuesQueryVariableParameter
  LabelNamesQuery: LabelNamesQueryVariableParameter
};

export interface PromQLQueryVariableParameter {
  expr: string;
  label_name: string;
  capturing_regexp: string;
}

export interface LabelNamesQueryVariableParameter {
  matchers?: string[];
  capturing_regexp: string;
}

export interface LabelValuesQueryVariableParameter {
  label_name: string;
  matchers?: string[];
  capturing_regexp: string;
}

export interface ConstantVariableParameter {
  values: string[];
}

type PermutationParameter<T> = {
  [K in keyof T]: {
    kind: K;
    parameter: T[K]
  }
}[keyof T];

interface CommonDashboardVariable {
  hide: boolean;
  selected: string;
}

export type DashboardVariable = CommonDashboardVariable & PermutationParameter<ParametersType>;

type ChartType = {
  LineChart: LineChart,
};

export interface LineChart {
  lines: {
    expr: string
  };
  show_legend: boolean;
}

type PermutationChart<T> = {
  [K in keyof T]: {
    kind: K;
    chart: T[K]
  }
}[keyof T];

export interface CommonPanel {
  name: string;
  order: number;
}

export type Panel = CommonPanel & PermutationChart<ChartType>;

export interface DashboardSection {
  name: string;
  order: number;
  open: boolean;
  panels: Panel[];
}

export interface DashboardSpec {
  datasource: string;
  duration: string;
  variables: Record<string, DashboardVariable>;
  sections: DashboardSection[];
}

export interface DashboardModel extends HeaderModel {
  metadata: ProjectMetadata;
  spec: DashboardSpec;
}
