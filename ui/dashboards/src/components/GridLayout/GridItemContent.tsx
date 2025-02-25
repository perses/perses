// Copyright 2023 The Perses Authors
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

import { Box } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, usePlugin, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { ReactElement } from 'react';
import { PanelGroupItemId, useEditMode, usePanel, usePanelActions, useViewPanelGroup } from '../../context';
import { Panel, PanelProps, PanelOptions } from '../Panel';
import { isPanelGroupItemIdEqual } from '../../context/DashboardProvider/panel-group-slice';

export interface GridItemContentProps {
  panelGroupItemId: PanelGroupItemId;
  width: number; // necessary for determining the suggested step ms
  panelOptions?: PanelOptions;
}

/**
 * Resolves the reference to panel content in a GridItemDefinition and renders the panel.
 */
export function GridItemContent(props: GridItemContentProps): ReactElement {
  const { panelGroupItemId, width } = props;
  const panelDefinition = usePanel(panelGroupItemId);
  const {
    spec: { queries },
  } = panelDefinition;
  const { isEditMode } = useEditMode();
  const { openEditPanel, openDeletePanelDialog, duplicatePanel, viewPanel } = usePanelActions(panelGroupItemId);
  const viewPanelGroupItemId = useViewPanelGroup();
  const { ref, inView } = useInView({
    threshold: 0.2, // we have the flexibility to adjust this threshold to trigger queries slightly earlier or later based on performance
    initialInView: false,
    triggerOnce: true,
  });

  const readHandlers = {
    isPanelViewed: isPanelGroupItemIdEqual(viewPanelGroupItemId, panelGroupItemId),
    onViewPanelClick: function (): void {
      if (viewPanelGroupItemId === undefined) {
        viewPanel(panelGroupItemId);
      } else {
        viewPanel(undefined);
      }
    },
  };

  // Provide actions to the panel when in edit mode
  let editHandlers: PanelProps['editHandlers'] = undefined;
  if (isEditMode) {
    editHandlers = {
      onEditPanelClick: openEditPanel,
      onDuplicatePanelClick: duplicatePanel,
      onDeletePanelClick: openDeletePanelDialog,
    };
  }

  // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
  const suggestedStepMs = useSuggestedStepMs(width);

  const { data: plugin } = usePlugin('Panel', panelDefinition.spec.plugin.kind);

  const queryDefinitions = queries ?? [];
  const definitions = queryDefinitions.map((query) => {
    return {
      kind: query.spec.plugin.kind,
      spec: query.spec.plugin.spec,
    };
  });
  const pluginQueryOptions =
    typeof plugin?.queryOptions === 'function'
      ? plugin?.queryOptions(panelDefinition.spec.plugin.spec)
      : plugin?.queryOptions;

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      <DataQueriesProvider
        definitions={definitions}
        options={{ suggestedStepMs, ...pluginQueryOptions }}
        queryOptions={{ enabled: inView }}
      >
        {inView && (
          <Panel
            definition={panelDefinition}
            readHandlers={readHandlers}
            editHandlers={editHandlers}
            panelOptions={props.panelOptions}
            panelGroupItemId={panelGroupItemId}
          />
        )}
      </DataQueriesProvider>
    </Box>
  );
}
