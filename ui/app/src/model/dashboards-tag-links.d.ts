// Copyright The Perses Authors
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

import type { TimeRangeValue, VariableValue } from '@perses-dev/spec';
import type { ReactElement, ReactNode } from 'react';

// @perses-dev/dashboards 0.56.0-beta.1 does not export the tag-link catalog yet.
// Remove this file when the dependency includes those exports.
declare module '@perses-dev/dashboards' {
  export interface TagLinkHit {
    name: string;
    label: string;
    variableNames?: string[];
  }

  export interface DashboardCatalog {
    search: (project: string, tags: string[]) => Promise<TagLinkHit[]>;
    queryKey: (project: string, tags: string[]) => readonly unknown[];
    href: (input: {
      project: string;
      name: string;
      keepTime: boolean;
      includeVariables: boolean;
      timeRange?: TimeRangeValue;
      variables?: Record<string, { value: VariableValue }>;
      variableNames: string[];
    }) => string;
  }

  export function appendLinkState(
    url: string,
    input: {
      keepTime: boolean;
      includeVariables: boolean;
      timeRange?: TimeRangeValue;
      variables?: Record<string, { value: VariableValue }>;
      variableNames?: string[];
    },
  ): string;

  export function DashboardCatalogProvider(props: { catalog: DashboardCatalog; children: ReactNode }): ReactElement;
}
