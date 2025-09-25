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

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, PluginSpecEditor, usePlugin, useSuggestedStepMs } from '@perses-dev/plugin-system';
import React, { ReactElement, useMemo, useState } from 'react';
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

  const [openQueryViewer, setOpenQueryViewer] = useState(false);

  const viewQueriesHandler = useMemo(() => {
    return isEditMode || !queries?.length
      ? undefined
      : {
          onClick: (): void => {
            setOpenQueryViewer(true);
          },
        };
  }, [isEditMode, queries]);

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

  const queryRows = useMemo(() => {
    if (!queries?.length) return null;

    const queryItems: ReactElement[] = [];
    queries.forEach((query, index) => {
      if (query?.spec?.plugin?.kind && query?.kind) {
        queryItems.push(
          <React.Fragment key={`query-${index}`}>
            <PluginSpecEditor
              value={query.spec.plugin.spec}
              pluginSelection={{ kind: query.spec.plugin.kind, type: query.kind }}
              onChange={(): void => {}}
              isReadonly
            />
            {index < queries.length - 1 && <Divider sx={{ my: 2 }} />}
          </React.Fragment>
        );
      }
    });

    return queryItems;
  }, [queries]);

  const onCloseHandler = (): void => {
    setOpenQueryViewer(false);
  };

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      <Dialog
        fullWidth
        PaperProps={{
          sx: {
            margin: '10px',
            width: 'calc(100% - 20px)',
          },
        }}
        maxWidth="lg"
        open={openQueryViewer}
      >
        <DialogTitle>Query Viewer</DialogTitle>
        <DialogContent>
          <Box sx={{ padding: '5px' }}>{queryRows}</Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onCloseHandler} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
            viewQueriesHandler={viewQueriesHandler}
            panelOptions={props.panelOptions}
            panelGroupItemId={panelGroupItemId}
          />
        )}
      </DataQueriesProvider>
    </Box>
  );
}
