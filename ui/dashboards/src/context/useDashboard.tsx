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

import { createPanelRef, DashboardResource, EphemeralDashboardResource, GridDefinition } from '@perses-dev/core';
import { PanelGroupDefinition, PanelGroupId, useDashboardStore } from './DashboardProvider';
import { useVariableActions, useVariableDefinitions } from './VariableProvider';

export function useDashboard() {
  const {
    panels,
    panelGroups,
    panelGroupOrder,
    setDashboard: setDashboardResource,
    kind,
    metadata,
    display,
    duration,
    refreshInterval,
    datasources,
    ttl,
  } = useDashboardStore(
    ({
      panels,
      panelGroups,
      panelGroupOrder,
      setDashboard,
      kind,
      metadata,
      display,
      duration,
      refreshInterval,
      datasources,
      ttl,
    }) => ({
      panels,
      panelGroups,
      panelGroupOrder,
      setDashboard,
      kind,
      metadata,
      display,
      duration,
      refreshInterval,
      datasources,
      ttl,
    })
  );
  const { setVariableDefinitions } = useVariableActions();
  const variables = useVariableDefinitions();
  const layouts = convertPanelGroupsToLayouts(panelGroups, panelGroupOrder);

  const dashboard =
    kind === 'Dashboard'
      ? ({
          kind,
          metadata,
          spec: {
            display,
            panels,
            layouts,
            variables,
            duration,
            refreshInterval,
            datasources,
          },
        } as DashboardResource)
      : ({
          kind,
          metadata,
          spec: {
            display,
            panels,
            layouts,
            variables,
            duration,
            refreshInterval,
            datasources,
            ttl,
          },
        } as EphemeralDashboardResource);

  const setDashboard = (dashboardResource: DashboardResource | EphemeralDashboardResource) => {
    setVariableDefinitions(dashboardResource.spec.variables);
    setDashboardResource(dashboardResource);
  };

  return {
    dashboard,
    setDashboard,
  };
}

function convertPanelGroupsToLayouts(
  panelGroups: Record<number, PanelGroupDefinition>,
  panelGroupOrder: PanelGroupId[]
): GridDefinition[] {
  const layouts: GridDefinition[] = [];
  panelGroupOrder.map((groupOrderId) => {
    const group = panelGroups[groupOrderId];
    if (group === undefined) {
      throw new Error('panel group not found');
    }
    const { title, isCollapsed, itemLayouts, itemPanelKeys } = group;
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
        items: itemLayouts.map((layout) => {
          const panelKey = itemPanelKeys[layout.i];
          if (panelKey === undefined) {
            throw new Error(`Missing panel key of layout ${layout.i}`);
          }
          return {
            x: layout.x,
            y: layout.y,
            width: layout.w,
            height: layout.h,
            content: createPanelRef(panelKey),
          };
        }),
      },
    };
    layouts.push(layout);
  });

  return layouts;
}
