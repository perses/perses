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
import { Box, BoxProps, Collapse, GlobalStyles } from '@mui/material';
import { GridDefinition } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { styles } from '../../css/styles';
import { useEditMode } from '../../context';
import { GridTitle } from './GridTitle';
import { GridItemContent } from './GridItemContent';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface GridLayoutProps extends BoxProps {
  groupIndex: number;
  definition: GridDefinition;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps) {
  const {
    groupIndex,
    definition: { spec },
    ...others
  } = props;

  const [isOpen, setIsOpen] = useState(spec.display?.collapse?.open ?? true);
  const { isEditMode } = useEditMode();

  return (
    <>
      <GlobalStyles styles={styles} />
      <Box {...others} component="section" sx={{ '& + &': { marginTop: (theme) => theme.spacing(1) } }}>
        {spec.display !== undefined && (
          <GridTitle
            groupIndex={groupIndex}
            title={spec.display.title}
            collapse={
              spec.display.collapse === undefined
                ? undefined
                : { isOpen, onToggleOpen: () => setIsOpen((current) => !current) }
            }
          />
        )}
        <Collapse in={isOpen} unmountOnExit>
          <ResponsiveGridLayout
            className="layout"
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 24, md: 24, sm: 24, xs: 24, xxs: 2 }}
            rowHeight={30}
            draggableHandle={'.drag-handle'}
            resizeHandles={['se']}
            isDraggable={isEditMode}
            isResizable={isEditMode}
          >
            {spec.items.map(({ x, y, width, height, content }, itemIndex) => (
              <div key={itemIndex} data-grid={{ x, y, w: width, h: height }}>
                <ErrorBoundary FallbackComponent={ErrorAlert}>
                  <GridItemContent groupIndex={groupIndex} itemIndex={itemIndex} content={content} />
                </ErrorBoundary>
              </div>
            ))}
          </ResponsiveGridLayout>
        </Collapse>
      </Box>
    </>
  );
}
