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

import type { DashboardResource, Resource } from '@perses-dev/client';

export interface ResourceListProps {
  query: string;
  handleClose: () => void;
  isResources?: (type: ResourceType, available: boolean) => void;
}

export type ResourceType = 'dashboards' | 'projects' | 'globalDatasources' | 'datasources';

export const ALL_RESOURCE_TYPES_TITLES: Readonly<Record<ResourceType, string>> = {
  dashboards: 'Dashboards',
  projects: 'Projects',
  globalDatasources: 'Global Datasources',
  datasources: 'Datasources',
};

export const ALL_RESOURCE_TYPES: ResourceType[] = ['dashboards', 'projects', 'datasources', 'globalDatasources'];

export type HighlightedDashboardResource = DashboardResource & {
  highlight: boolean;
};

export type SearchItem = Resource;

export interface SearchListProps {
  list: SearchItem[];
  query: string;
  handleClose: () => void;
  isResource?: (isAvailable: boolean) => void;
}

export interface SearchItemProps {
  handleClose: SearchListProps['handleClose'];
}
