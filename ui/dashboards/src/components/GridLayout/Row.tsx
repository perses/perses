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

import { Collapse, useTheme } from '@mui/material';
import { PanelGroupId } from '@perses-dev/core';
import { PanelGroupDefinition, PanelGroupItemLayout, PanelOptions, useViewPanelGroup } from '@perses-dev/dashboards';
import { ReactElement, useMemo, useState } from 'react';
import { Layout, Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { GRID_LAYOUT_COLS, GRID_LAYOUT_SMALL_BREAKPOINT } from '../../constants';
import { GridContainer } from './GridContainer';
import { GridItemContent } from './GridItemContent';
import { GridTitle } from './GridTitle';

const DEFAULT_MARGIN = 10;
const ROW_HEIGHT = 30;

export interface RowProps {
  panelGroupId: PanelGroupId;
  groupDefinition: PanelGroupDefinition;
  gridColWidth: number;
  panelFullHeight?: number;
  panelOptions?: PanelOptions;
  isEditMode?: boolean;
  onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
  onWidthChange?: (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number]
  ) => void;
  repeatVariable?: [string, string];
}

export function Row({
  panelGroupId,
  groupDefinition,
  gridColWidth,
  panelFullHeight,
  panelOptions,
  isEditMode = false,
  onLayoutChange,
  onWidthChange,
  repeatVariable,
}: RowProps): ReactElement {
  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);
  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed);
  const theme = useTheme();

  const viewPanelItemId = useViewPanelGroup();

  const hasViewPanel =
    viewPanelItemId?.panelGroupId === panelGroupId &&
    // Check for repeatVariable panels
    viewPanelItemId.repeatVariable?.[0] === repeatVariable?.[0] &&
    viewPanelItemId.repeatVariable?.[1] === repeatVariable?.[1];
  const itemLayoutViewed = viewPanelItemId?.panelGroupItemLayoutId;

  // If there is a panel in view mode, we should hide the grid if the panel is not in the current group.
  const isGridDisplayed = viewPanelItemId === undefined || hasViewPanel;

  // Item layout is override if there is a panel in view mode
  const itemLayouts: PanelGroupItemLayout[] = useMemo(() => {
    if (itemLayoutViewed) {
      return groupDefinition.itemLayouts.map((itemLayout) => {
        if (itemLayout.i === itemLayoutViewed) {
          const rowTitleHeight = 40 + 8; // 40 is the height of the row title and 8 is the margin height
          return {
            h: Math.round(((panelFullHeight ?? window.innerHeight) - rowTitleHeight) / (ROW_HEIGHT + DEFAULT_MARGIN)), // Viewed panel should take the full height remaining
            i: itemLayoutViewed,
            w: 48,
            x: 0,
            y: 0,
          } as PanelGroupItemLayout;
        }
        return itemLayout;
      });
    }
    return groupDefinition.itemLayouts;
  }, [groupDefinition.itemLayouts, itemLayoutViewed, panelFullHeight]);

  return (
    <GridContainer
      sx={{
        display: isGridDisplayed ? 'block' : 'none',
        height: itemLayoutViewed ? `${panelFullHeight}px` : 'unset',
        overflow: itemLayoutViewed ? 'hidden' : 'unset',
      }}
    >
      {groupDefinition.title !== undefined && (
        <GridTitle
          panelGroupId={panelGroupId}
          title={groupDefinition.title}
          collapse={
            groupDefinition.isCollapsed === undefined
              ? undefined
              : { isOpen, onToggleOpen: () => setIsOpen((current) => !current) }
          }
        />
      )}
      <Collapse in={isOpen} unmountOnExit appear={false} data-testid="panel-group-content">
        <ResponsiveGridLayout
          className="layout"
          breakpoints={{ [GRID_LAYOUT_SMALL_BREAKPOINT]: theme.breakpoints.values.sm, xxs: 0 }}
          cols={GRID_LAYOUT_COLS}
          rowHeight={ROW_HEIGHT}
          draggableHandle=".drag-handle"
          resizeHandles={['se']}
          isDraggable={isEditMode && !hasViewPanel}
          isResizable={isEditMode && !hasViewPanel}
          margin={[DEFAULT_MARGIN, DEFAULT_MARGIN]}
          containerPadding={[0, 10]}
          layouts={{ sm: itemLayouts }}
          onLayoutChange={onLayoutChange}
          onWidthChange={onWidthChange}
          allowOverlap={hasViewPanel} // Enabling overlap when viewing a specific panel because panel in front of the viewed panel will add empty spaces (empty row height)
        >
          {itemLayouts.map(({ i, w }) => (
            <div
              key={i}
              style={{
                display: itemLayoutViewed !== undefined ? (itemLayoutViewed === i ? 'unset' : 'none') : 'unset',
              }}
            >
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <GridItemContent
                  panelOptions={panelOptions}
                  panelGroupItemId={{ panelGroupId, panelGroupItemLayoutId: i, repeatVariable }}
                  width={calculateGridItemWidth(w, gridColWidth)}
                />
              </ErrorBoundary>
            </div>
          ))}
        </ResponsiveGridLayout>
      </Collapse>
    </GridContainer>
  );
}

const calculateGridItemWidth = (w: number, colWidth: number): number => {
  // 0 * Infinity === NaN, which causes problems with resize contraints
  if (!Number.isFinite(w)) return w;
  return Math.round(colWidth * w + Math.max(0, w - 1) * DEFAULT_MARGIN);
};
