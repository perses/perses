// Copyright 2021 The Perses Authors
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

export interface GrafanaDashboardJson {
  templating: {
    list: GrafanaVariable[];
  };
  time: GrafanaTimeRange;
  title: string;
}

export interface GrafanaTimeRange {
  from: string;
  to: string;
}

export type GrafanaVariable =
  | DataSourceVariable
  | QueryVariable
  | CustomVariable;

export type DataSourceVariable = GrafanaVariableBase & {
  type: 'datasource';
};

export type QueryVariable = GrafanaVariableBase & {
  type: 'query';
  datasource: string;
};

export type CustomVariable = GrafanaVariableBase & {
  type: 'custom';
  options: Array<{
    selected: boolean;
    text: string;
    value: string;
  }>;
};

type GrafanaVariableBase = GrafanaSingleVariable | GrafanaMultiVariable;

type GrafanaVariableCommon = {
  // 0 === not hidden, 1 === hide label, 2 === hide variable
  hide: 0 | 1 | 2;
  label: string | null;
  name: string;
  // This means different things on different variables types
  query: string;
};

type GrafanaSingleVariable = GrafanaVariableCommon & {
  multi: false;
  // This is basically the default value
  current:
    | Record<string, never>
    | {
        // Whether a user selected this as the default value and saved it
        selected: boolean;
        text: string;
        value: string;
      };
};

type GrafanaMultiVariable = GrafanaVariableCommon & {
  multi: true;
  includeAll: boolean;
  allValue: string | null;
  current: {
    selected: boolean;
    text: string[];
    value: string[];
  };
};
