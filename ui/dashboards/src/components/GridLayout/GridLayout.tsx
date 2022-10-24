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
import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Box, BoxProps, Collapse, GlobalStyles, useTheme } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { styles } from '../../css/styles';
import { useEditMode, usePanelGroup, usePanelGroupActions, PanelGroupId } from '../../context';
import { GridTitle } from './GridTitle';
import { GridItemContent } from './GridItemContent';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridLayoutProps extends BoxProps {
  panelGroupId: PanelGroupId;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps) {
  const { panelGroupId, ...others } = props;
  const theme = useTheme();
  const groupDefinition = usePanelGroup(panelGroupId);
  const { updatePanelGroupLayouts } = usePanelGroupActions(panelGroupId);

  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed ?? true);
  const { isEditMode } = useEditMode();

  return (
    <>
      <GlobalStyles styles={styles} />
      <Box {...others} component="section" sx={{ '& + &': { marginTop: (theme) => theme.spacing(1) } }}>
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
        <Collapse in={isOpen} unmountOnExit>
          <ResponsiveGridLayout
            className="layout"
            breakpoints={{ sm: theme.breakpoints.values.sm, xxs: 0 }}
            cols={{ sm: 24, xxs: 2 }}
            rowHeight={30}
            draggableHandle={'.drag-handle'}
            resizeHandles={['se']}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            containerPadding={[0, 10]}
            layouts={{ sm: groupDefinition.itemLayouts }}
            onLayoutChange={updatePanelGroupLayouts}
          >
            {groupDefinition.itemLayouts.map(({ i }) => (
              <div key={i}>
                <ErrorBoundary FallbackComponent={ErrorAlert}>
                  <GridItemContent panelGroupItemId={{ panelGroupId, panelGroupLayoutId: i }} />
                </ErrorBoundary>
              </div>
            ))}
          </ResponsiveGridLayout>
        </Collapse>
      </Box>
    </>
  );
}
