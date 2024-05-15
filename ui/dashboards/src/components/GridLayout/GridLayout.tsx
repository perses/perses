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
import { useMemo, useState } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import { Collapse, useTheme } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  useEditMode,
  usePanelGroup,
  usePanelGroupActions,
  PanelGroupId,
  PanelGroupItemLayout,
  useViewPanel,
  PanelGroupDefinition,
} from '../../context';
import { GRID_LAYOUT_COLS, GRID_LAYOUT_SMALL_BREAKPOINT } from '../../constants';
import { PanelOptions } from '../Panel';
import { GridTitle } from './GridTitle';
import { GridItemContent } from './GridItemContent';
import { GridContainer } from './GridContainer';
const DEFAULT_MARGIN = 10;
const ROW_HEIGHT = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridLayoutProps {
  panelGroupId: PanelGroupId;
  panelOptions?: PanelOptions;
  panelFullHeight?: number;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps) {
  const { panelGroupId, panelOptions, panelFullHeight } = props;
  const theme = useTheme();
  const groupDefinition: PanelGroupDefinition = usePanelGroup(panelGroupId);
  const { updatePanelGroupLayouts } = usePanelGroupActions(panelGroupId);

  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed ?? true);
  const { isEditMode } = useEditMode();

  const [gridColWidth, setGridColWidth] = useState(0);

  const viewPanelItemId = useViewPanel();
  const hasViewPanel = viewPanelItemId?.panelGroupId === panelGroupId; // current panelGroup contains the panel extended?
  const itemLayoutViewed = viewPanelItemId?.panelGroupItemLayoutId;

  // If there is a panel in view mode, we should hide the grid if the panel is not in the current group.
  const isGridDisplayed = useMemo(() => {
    if (viewPanelItemId === undefined) {
      return true;
    }
    return hasViewPanel;
  }, [hasViewPanel, viewPanelItemId]);

  // Item layout is override if there is a panel in view mode
  const itemLayouts: PanelGroupItemLayout[] = useMemo(() => {
    if (itemLayoutViewed) {
      return groupDefinition.itemLayouts.map((itemLayout) => {
        if (itemLayout.i === itemLayoutViewed) {
          const rowTitleHeight = 40 + 8; // 8 is the margin height
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

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    // Using the value from `allLayouts` instead of `currentLayout` because of
    // a bug in react-layout-grid where `currentLayout` does not adjust properly
    // when going to a smaller breakpoint and then back to a larger breakpoint.
    // https://github.com/react-grid-layout/react-grid-layout/issues/1663
    const smallLayout = allLayouts[GRID_LAYOUT_SMALL_BREAKPOINT];
    if (smallLayout && !hasViewPanel) {
      updatePanelGroupLayouts(smallLayout);
    }
  };

  /**
   * Calculate the column width so we can determine the width of each panel for suggested step ms
   * https://github.com/react-grid-layout/react-grid-layout/blob/master/lib/calculateUtils.js#L14-L35
   */
  const handleWidthChange = (
    containerWidth: number,
    margin: [number, number],
    cols: number,
    containerPadding: [number, number]
  ) => {
    const marginX = margin[0];
    const marginWidth = marginX * (cols - 1);
    const containerPaddingWidth = containerPadding[0] * 2;
    // exclude margin and padding from total width
    setGridColWidth((containerWidth - marginWidth - containerPaddingWidth) / cols);
  };

  return (
    <GridContainer sx={{ display: isGridDisplayed ? 'block' : 'none' }}>
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
          breakpoints={{ sm: theme.breakpoints.values.sm, xxs: 0 }}
          cols={GRID_LAYOUT_COLS}
          rowHeight={ROW_HEIGHT}
          draggableHandle=".drag-handle"
          resizeHandles={['se']}
          isDraggable={isEditMode && !hasViewPanel}
          isResizable={isEditMode && !hasViewPanel}
          margin={[DEFAULT_MARGIN, DEFAULT_MARGIN]}
          containerPadding={[0, 10]}
          layouts={{ [GRID_LAYOUT_SMALL_BREAKPOINT]: itemLayouts }}
          onLayoutChange={handleLayoutChange}
          onWidthChange={handleWidthChange}
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
                  panelGroupItemId={{ panelGroupId, panelGroupItemLayoutId: i }}
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

/**
 * Calculates grid item width
 * @param w number of columns the grid item spans
 * @param colWidth the width of each column in px
 * @returns grid item's width in px
 * https://github.com/react-grid-layout/react-grid-layout/blob/master/lib/calculateUtils.js#L14-L35
 */
const calculateGridItemWidth = (w: number, colWidth: number) => {
  // 0 * Infinity === NaN, which causes problems with resize contraints
  if (!Number.isFinite(w)) return w;
  return Math.round(colWidth * w + Math.max(0, w - 1) * DEFAULT_MARGIN);
};
