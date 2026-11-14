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

import { appendLinkState } from '@perses-dev/dashboards';
import type { DashboardCatalog } from '@perses-dev/dashboards';

import { PERSES_APP_CONFIG } from '../config';
import { searchDashboardsByTags } from './search-client';

function sortedTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '')
    .sort();
}

export const persesDashboardCatalog: DashboardCatalog = {
  queryKey(project, tags) {
    return ['dashboards', '__INTERNAL_SEARCH_KEY__', 'tags', project, sortedTags(tags)];
  },
  async search(project, tags) {
    const required = sortedTags(tags);
    // No tag would list every dashboard. The menu has nothing to show in that case.
    if (project === '' || required.length === 0) {
      return [];
    }
    const hits = await searchDashboardsByTags(project, required);
    return hits.map((hit) => ({
      name: hit.metadata.name,
      label: hit.displayName,
      variableNames: hit.variables,
    }));
  },
  href(input) {
    const path = `${PERSES_APP_CONFIG.api_prefix}/projects/${encodeURIComponent(input.project)}/dashboards/${encodeURIComponent(input.name)}`;
    return appendLinkState(path, input);
  },
};
