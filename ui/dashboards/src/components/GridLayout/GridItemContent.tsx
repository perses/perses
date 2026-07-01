// Copyright 2025 The Perses Authors
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

import { Box, Checkbox, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, usePlugin, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { ReactElement, useMemo, useState } from 'react';
import { isPanelGroupItemIdEqual, PanelGroupItemId } from '@perses-dev/core';
import { BooleanParam, JsonParam, useQueryParam } from 'use-query-params';
import { useEditMode, usePanel, usePanelActions, useViewPanelGroup, usePanelRef } from '../../context';
import { Panel, PanelProps, PanelOptions } from '../Panel';
import { QueryViewerDialog } from '../QueryViewerDialog';

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
  const theme = useTheme();
  const panelDefinition = usePanel(panelGroupItemId);

  const {
    spec: { queries },
  } = panelDefinition;

  const { isEditMode } = useEditMode();
  const { openEditPanel, openDeletePanelDialog, duplicatePanel, viewPanel } = usePanelActions(panelGroupItemId);
  const viewPanelGroupItemId = useViewPanelGroup();
  const [, setDetailedView] = useQueryParam('detailedView', BooleanParam);
  const { ref, inView } = useInView({
    threshold: 0.2, // we have the flexibility to adjust this threshold to trigger queries slightly earlier or later based on performance
    initialInView: false,
    triggerOnce: true,
  });

  const [openQueryViewer, setOpenQueryViewer] = useState(false);

  // Panel selection state
  const [panelSelectMode] = useQueryParam('panelSelectMode', BooleanParam);
  const [selectedPanels, setSelectedPanels] = useQueryParam('selectedPanels', JsonParam);
  const panelRef = usePanelRef(panelGroupItemId);
  const isSelectMode = panelSelectMode === true;
  const isViewingSelected = Array.isArray(selectedPanels) && selectedPanels.length > 0 && !isSelectMode;
  const isSelected =
    isSelectMode && Array.isArray(selectedPanels) && panelRef
      ? (selectedPanels as string[]).includes(panelRef.ref)
      : false;

  const handleToggleSelect = (): void => {
    if (!panelRef) return;
    const current: string[] = Array.isArray(selectedPanels) ? (selectedPanels as string[]) : [];
    if (isSelected) {
      setSelectedPanels(current.filter((r) => r !== panelRef.ref));
    } else {
      setSelectedPanels([...current, panelRef.ref]);
    }
  };

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
        // Clear detailed view when using toggle view mode
        setDetailedView(undefined);
      } else {
        viewPanel(undefined);
        // Clear detailed view when closing panel
        setDetailedView(undefined);
      }
    },
  };

  const detailedViewHandler = {
    onDetailedViewClick: function (): void {
      // Open panel in detailed view mode
      viewPanel(panelGroupItemId);
      setDetailedView(true);
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

  // Get detailed view state
  const [detailedView] = useQueryParam('detailedView', BooleanParam);
  const isDetailedView = detailedView === true;

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Selection overlay — shown in panel select mode */}
      {isSelectMode && (
        <Box
          onClick={handleToggleSelect}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            cursor: 'pointer',
            border: '2px solid',
            borderColor: isSelected ? theme.palette.primary.main : 'transparent',
            borderRadius: 1,
            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            transition: 'border-color 0.15s, background-color 0.15s',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          {/* Checkbox positioned top-right to avoid overlapping the panel title */}
          <Checkbox
            checked={isSelected}
            size="small"
            sx={{ position: 'absolute', top: 2, right: 4, pointerEvents: 'none', p: 0 }}
          />
        </Box>
      )}
      <DataQueriesProvider
        definitions={definitions}
        options={{ suggestedStepMs, ...pluginQueryOptions }}
        queryOptions={{ enabled: inView }}
      >
        {inView && (
          <Panel
            definition={panelDefinition}
            readHandlers={isDetailedView || isSelectMode || isViewingSelected ? undefined : readHandlers}
            detailedViewHandler={isDetailedView || isSelectMode || isViewingSelected ? undefined : detailedViewHandler}
            editHandlers={isDetailedView || isSelectMode || isViewingSelected ? undefined : editHandlers}
            viewQueriesHandler={isDetailedView || isSelectMode || isViewingSelected ? undefined : viewQueriesHandler}
            panelOptions={props.panelOptions}
            panelGroupItemId={panelGroupItemId}
          />
        )}
      </DataQueriesProvider>
      <QueryViewerDialog
        open={openQueryViewer}
        queryDefinitions={queryDefinitions}
        onClose={() => setOpenQueryViewer(false)}
      />
    </Box>
  );
}
