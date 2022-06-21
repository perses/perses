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

import { useState } from 'react';
import { Box, BoxProps, Collapse } from '@mui/material';
import { GridDefinition, GridItemDefinition } from '@perses-dev/core';
import { GridTitle } from './GridTitle';

const COLUMNS = 24;

export interface GridLayoutProps extends BoxProps {
  definition: GridDefinition;
  renderGridItemContent: (definition: GridItemDefinition) => React.ReactNode;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps) {
  const {
    definition: { spec },
    renderGridItemContent,
    ...others
  } = props;

  const [isOpen, setIsOpen] = useState(spec.display?.collapse?.open ?? true);

  const gridItems: React.ReactNode[] = [];
  let mobileRowStart = 1;

  spec.items.forEach((item, idx) => {
    // Try to maintain the chart's aspect ratio on mobile
    const widthScale = COLUMNS / item.width;
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
        {renderGridItemContent(item)}
      </Box>
    );

    mobileRowStart += mobileRows;
  });

  return (
    <Box {...others} component="section" sx={{ '& + &': { marginTop: (theme) => theme.spacing(1) } }}>
      {spec.display !== undefined && (
        <GridTitle
          title={spec.display.title}
          collapse={
            spec.display.collapse === undefined
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
