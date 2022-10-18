// Copyright 2022 The Perses Authors
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

import { DashboardSpec, GridDefinition } from '@perses-dev/core';
import { PanelGroupDefinition, useDashboardStore } from './DashboardProvider';
import { useTemplateVariableDefinitions } from './TemplateVariableProvider';

export function useDashboardSpec(): DashboardSpec {
  const { panels, panelGroups } = useDashboardStore(({ panels, panelGroups }) => ({ panels, panelGroups }));
  const variables = useTemplateVariableDefinitions();
  const layouts = convertPanelGroupsToLayouts(panelGroups);

  return {
    panels,
    layouts,
    variables,
    duration: '1h', // to do
  };
}

function convertPanelGroupsToLayouts(panelGroups: Record<number, PanelGroupDefinition>): GridDefinition[] {
  const layouts: GridDefinition[] = [];
  Object.values(panelGroups).forEach((group) => {
    const { title, isCollapsed, items } = group;
    let display = undefined;
    if (title) {
      display = {
        title,
        collapse: {
          open: !isCollapsed,
        },
      };
    }
    const layout: GridDefinition = {
      kind: 'Grid',
      spec: {
        display,
        items,
      },
    };
    layouts.push(layout);
  });
  return layouts;
}
