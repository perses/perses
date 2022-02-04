// Copyright 2021 The Perses Authors
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

import { useState, useMemo } from 'react';
import { Box, BoxProps, Collapse } from '@mui/material';
import { GridDefinition, GridItemDefinition, useDashboardSpec } from '@perses-dev/core';
import { resolvePanelRef } from '@perses-dev/plugin-system';
import AlertErrorBoundary from '../../components/AlertErrorBoundary';
import GridTitle from './GridTitle';
import Panel from './Panel';

const COLUMNS = 24;

export interface GridLayoutProps extends BoxProps {
  definition: GridDefinition;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
function GridLayout(props: GridLayoutProps) {
  const {
    definition: { display, items },
    ...others
  } = props;

  const [isOpen, setIsOpen] = useState(display?.collapse?.open ?? true);

  const gridItems = useMemo(() => {
    const gridItems: React.ReactNode[] = [];
    let mobileRowStart = 1;

    items.forEach((item, idx) => {
      // Try to maintain the chart's aspect ratio on mobile
      const widthScale = 24 / item.width;
      const mobileRows = Math.floor(item.height * widthScale);

      gridItems.push(
        <Box
          key={idx}
          sx={{
            gridColumn: {
              xs: `1 / span ${COLUMNS}`,
              sm: `${item.x + 1} / span ${item.width}`,
            },
            gridRow: {
              xs: `${mobileRowStart} / span ${mobileRows}`,
              sm: `${item.y + 1} / span ${item.height}`,
            },
          }}
        >
          <AlertErrorBoundary>
            <GridItemContent content={item.content} />
          </AlertErrorBoundary>
        </Box>
      );

      mobileRowStart += mobileRows;
    });
    return gridItems;
  }, [items]);

  return (
    <Box {...others} component="section" sx={{ '& + &': { marginTop: (theme) => theme.spacing(1) } }}>
      {display !== undefined && (
        <GridTitle
          title={display.title}
          collapse={
            display.collapse === undefined
              ? undefined
              : { isOpen, onToggleOpen: () => setIsOpen((current) => !current) }
          }
        />
      )}
      <Collapse in={isOpen} unmountOnExit>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
            gridAutoRows: {
              xs: 24,
              sm: 36,
            },
            columnGap: (theme) => theme.spacing(1),
            rowGap: (theme) => theme.spacing(1),
          }}
        >
          {gridItems}
        </Box>
      </Collapse>
    </Box>
  );
}

export default GridLayout;

interface GridItemContentProps {
  content: GridItemDefinition['content'];
}

/**
 * Resolves the reference to panel content and renders the panel.
 */
function GridItemContent(props: GridItemContentProps) {
  const spec = useDashboardSpec();
  const definition = resolvePanelRef(spec, props.content);
  return <Panel definition={definition} />;
}
