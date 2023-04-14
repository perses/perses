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
import { useState } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import { Collapse, useTheme } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { useEditMode, usePanelGroup, usePanelGroupActions, PanelGroupId } from '../../context';
import { GRID_LAYOUT_COLS, GRID_LAYOUT_SMALL_BREAKPOINT } from '../../constants';
import { GridTitle } from './GridTitle';
import { GridItemContent } from './GridItemContent';
import { GridContainer } from './GridContainer';

const DEFAULT_MARGIN = 10;
const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridLayoutProps {
  panelGroupId: PanelGroupId;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps) {
  const { panelGroupId /*...others */ } = props;
  const theme = useTheme();
  const groupDefinition = usePanelGroup(panelGroupId);
  const { updatePanelGroupLayouts } = usePanelGroupActions(panelGroupId);

  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed ?? true);
  const { isEditMode } = useEditMode();

  const [gridColWidth, setGridColWidth] = useState(0);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    // Using the value from `allLayouts` instead of `currentLayout` because of
    // a bug in react-layout-grid where `currentLayout` does not adjust properly
    // when going to a smaller breakpoint and then back to a larger breakpoint.
    // https://github.com/react-grid-layout/react-grid-layout/issues/1663
    const smallLayout = allLayouts[GRID_LAYOUT_SMALL_BREAKPOINT];
    if (smallLayout) {
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
    <GridContainer>
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
          rowHeight={30}
          draggableHandle={'.drag-handle'}
          resizeHandles={['se']}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          margin={[DEFAULT_MARGIN, DEFAULT_MARGIN]}
          containerPadding={[0, 10]}
          layouts={{ [GRID_LAYOUT_SMALL_BREAKPOINT]: groupDefinition.itemLayouts }}
          onLayoutChange={handleLayoutChange}
          onWidthChange={handleWidthChange}
        >
          {groupDefinition.itemLayouts.map(({ i, w }) => (
            <div key={i}>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <GridItemContent
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
