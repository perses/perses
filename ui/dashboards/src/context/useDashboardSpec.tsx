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
    duration: '1h',
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
