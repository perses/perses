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

import { HeaderModel } from '../../shared/model/api/v1/kind.model';
import { ProjectMetadata } from '../../shared/model/api/v1/metadata.model';

export type VariableKind = 'PromQLQuery' | 'LabelNamesQuery' | 'LabelValuesQuery' | 'Constant';

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

interface DashboardVariableInterface {
  kind: VariableKind;
  hide: boolean;
  selected: string;
}

export interface PromQLVariable extends DashboardVariableInterface {
  kind: 'PromQLQuery';
  parameter: PromQLQueryVariableParameter;
}

export interface LabelValuesVariable extends DashboardVariableInterface {
  kind: 'LabelValuesQuery';
  parameter: LabelValuesQueryVariableParameter;
}

export interface LabelNamesVariable extends DashboardVariableInterface {
  kind: 'LabelNamesQuery';
  parameter: LabelNamesQueryVariableParameter;
}

export interface ConstantVariable extends DashboardVariableInterface {
  kind: 'Constant';
  parameter: ConstantVariableParameter;
}

export type DashboardVariable = PromQLVariable | LabelValuesVariable | LabelNamesVariable | ConstantVariable;

export enum ChartKind {
  lineChart = 'LineChart'
}

export interface LineChart {
  lines: {
    expr: string
  };
  show_legend: boolean;
}

export interface Panel {
  name: string;
  order: number;
  kind: ChartKind;
  chart: LineChart;
}

export interface DashboardSection {
  name?: string;
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
