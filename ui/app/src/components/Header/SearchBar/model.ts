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

import type { MatchingInterval, MatchingResult } from '@nexucis/kvsearch';
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
  // Number of dashboards and datasources per project, displayed next to the project results.
  dashboardCounts?: Map<string, number>;
  datasourceCounts?: Map<string, number>;
}

export interface SearchItemProps {
  handleClose: SearchListProps['handleClose'];
  matchingResult?: MatchingResult[];
}

export interface TagsDisplayValue {
  normalizedMatchingTags: Set<string>;
  visibleTags: string[];
  hiddenTagsCount: number;
  hasAnyTags: boolean;
}

export const getDisplayNameMatch = (
  name: string,
  displayName?: string,
  matchingResult?: MatchingResult[],
): { value: string; intervals: MatchingInterval[] } => {
  const value = displayName || name;
  const path = displayName ? 'spec.display.name' : 'metadata.name';

  const match = matchingResult?.find((mr) => mr.path.join('.') === path);
  return {
    value,
    intervals: match?.intervals ?? [],
  };
};

export const MAX_VISIBLE_RESOURCE_TAGS = 3;

export const getTagDisplayValues = (tags: string[] | undefined, matchingTagValues: string[]): TagsDisplayValue => {
  const normalizedMatchingTags = new Set(matchingTagValues.map((tag) => tag.toLowerCase()));
  const uniqueTags = Array.from(new Set(tags ?? []));
  const matchedTags = uniqueTags.filter((tag) => normalizedMatchingTags.has(tag.toLowerCase()));
  const unmatchedTags = uniqueTags.filter((tag) => !normalizedMatchingTags.has(tag.toLowerCase()));
  const orderedTags = [...matchedTags, ...unmatchedTags];

  return {
    normalizedMatchingTags,
    visibleTags: orderedTags.slice(0, MAX_VISIBLE_RESOURCE_TAGS),
    hiddenTagsCount: Math.max(0, orderedTags.length - MAX_VISIBLE_RESOURCE_TAGS),
    hasAnyTags: orderedTags.length > 0,
  };
};
