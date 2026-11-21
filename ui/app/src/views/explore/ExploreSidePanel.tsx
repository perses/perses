// Copyright The Perses Authors
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

import type { Theme } from '@mui/material';
import { Button, Stack, useMediaQuery } from '@mui/material';
import { useLocalStorage } from '@perses-dev/components';
import ChevronLeft from 'mdi-material-ui/ChevronLeft';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

const COLLAPSED_KEY = 'PERSES_EXPLORE_LABELS_COLLAPSED';
const PANEL_WIDTH = 280;
const COLLAPSED_WIDTH = 15;

const COLLAPSE_BUTTON_SX = {
  position: 'absolute',
  top: 0,
  right: -15,
  zIndex: 1,
  padding: 0.5,
  minWidth: 'auto',
  backgroundColor: (theme: Theme) => theme.palette.background.default,
} as const;

export interface ExploreSidePanelProps {
  /** Accessible name of the panel. */
  label: string;
  children: ReactNode;
}

/** Collapsible panel shown on the left of an explorer, or above it on small screens. */
export function ExploreSidePanel(props: ExploreSidePanelProps): ReactElement {
  const { label, children } = props;
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [isCollapsed, setIsCollapsed] = useLocalStorage(COLLAPSED_KEY, false);
  const toggleCollapsed = useCallback(() => setIsCollapsed(!isCollapsed), [isCollapsed, setIsCollapsed]);

  const panelSx = useMemo(() => {
    let width: number | string = isCollapsed ? COLLAPSED_WIDTH : PANEL_WIDTH;
    if (isSmallScreen) {
      width = '100%';
    }
    return {
      position: 'relative',
      flexShrink: 0,
      width,
      maxHeight: isSmallScreen ? 400 : 'calc(100vh - 200px)',
      borderRight: isSmallScreen ? 0 : 1,
      borderBottom: isSmallScreen ? 1 : 0,
      borderColor: 'divider',
      pr: isCollapsed ? 0 : 2,
    } as const;
  }, [isCollapsed, isSmallScreen]);

  const toggleLabel = isCollapsed ? `Expand ${label}` : `Collapse ${label}`;

  return (
    <Stack component="aside" aria-label={label} sx={panelSx}>
      {!isSmallScreen && (
        <Button
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={!isCollapsed}
          variant="text"
          sx={COLLAPSE_BUTTON_SX}
          onClick={toggleCollapsed}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      )}
      {(!isCollapsed || isSmallScreen) && children}
    </Stack>
  );
}
