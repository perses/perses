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

import { useDashboardApp, usePanels } from '../../context';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';

export interface PanelEditorFormValues {
  name: string;
  description: string;
  group: number;
  kind: string;
  spec: unknown;
}

// Props that vary based on whether the PanelDrawer is in add or edit mode
interface PanelDrawerModel {
  drawerTitle: string;
  submitButtonText: string;
  initialValues: PanelEditorFormValues;
  applyChanges: (values: PanelEditorFormValues) => void;
}

/**
 * Returns props that are different depending on whether the PanelDrawer has been opened in add or edit mode. If the
 * drawer isn't open at all, returns undefined.
 */
export function usePanelDrawerModel(): PanelDrawerModel | undefined {
  const { panelDrawer } = useDashboardApp();
  const { panels, updatePanel } = usePanels();

  // If we're closed, no mode to return
  if (panelDrawer === undefined) {
    return undefined;
  }

  // If we don't have a panel key, we're adding a new panel
  const { panelKey, groupIndex } = panelDrawer;
  if (panelKey === undefined) {
    return {
      drawerTitle: 'Add Panel',
      submitButtonText: 'Add',
      initialValues: {
        name: '',
        description: '',
        group: groupIndex ?? 0,
        kind: '',
        spec: {},
      },
      applyChanges: (values) => {
        const { name, description, group, kind, spec } = values;
        const panelKey = removeWhiteSpacesAndSpecialCharacters(name);
        updatePanel(
          panelKey,
          {
            kind: 'Panel',
            spec: {
              display: { name, description },
              plugin: {
                kind,
                spec,
              },
            },
          },
          group
        );
      },
    };
  }

  // Otherwise we don't have a panel key, so we're trying to edit an existing panel
  const existingPanel = panels[panelKey];

  // TODO: Can we better express this via the type system on the dashboard store to avoid these states?
  if (existingPanel === undefined) {
    throw new Error(`Cannot find existing panel '${panelKey}' to edit`);
  }
  if (groupIndex === undefined) {
    throw new Error(`Cannot edit existing panel '${panelKey}' without its group index`);
  }

  return {
    drawerTitle: 'Edit Panel',
    submitButtonText: 'Apply',
    initialValues: {
      name: existingPanel.spec.display.name,
      description: existingPanel.spec.display.description ?? '',
      group: groupIndex,
      kind: existingPanel.spec.plugin.kind,
      spec: existingPanel.spec.plugin.spec, // TODO: Should we clone to be safe?
    },
    applyChanges: (values) => {
      const { name, description, group, kind, spec } = values;
      updatePanel(panelKey, {
        kind: 'Panel',
        spec: {
          display: { name, description },
          plugin: {
            kind,
            spec,
          },
        },
      });

      if (group !== groupIndex) {
        // TO DO: need to move panel if panel group changes
      }
    },
  };
}
