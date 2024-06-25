// Copyright 2024 The Perses Authors
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

import { MouseEvent as ReactMouseEvent, useCallback } from 'react';
import { Box, styled } from '@mui/material';
import { gridColor } from '../utils';
import { useMouseMove } from '../useMouseMove';

interface ResizableDividerProps {
  parentRef: React.RefObject<HTMLDivElement | undefined>;
  setNameColumnWidth: (x: number) => void;
}

export function ResizableDivider(props: ResizableDividerProps) {
  const { parentRef, setNameColumnWidth } = props;

  const handleMouseDown = (e: ReactMouseEvent) => {
    // disable any default actions (text selection, etc.)
    e.preventDefault();

    setResizing(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!parentRef.current) return;

      const offsetX = e.clientX - parentRef.current.getBoundingClientRect().left;
      const newNameColumnWidth = offsetX / parentRef.current.getBoundingClientRect().width;

      if (0.05 <= newNameColumnWidth && newNameColumnWidth <= 0.95) {
        setNameColumnWidth(newNameColumnWidth);
      }
    },
    [parentRef, setNameColumnWidth]
  );

  const [_, setResizing] = useMouseMove({
    handleMouseMove,
  });

  // prevent onClick event from row when clicking on a divider
  return <ResizableDividerBox onMouseDown={handleMouseDown} onClick={(e) => e.stopPropagation()} />;
}

const ResizableDividerBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '1px',
  height: '100%',
  backgroundColor: gridColor(theme),
  cursor: 'col-resize',

  // increase clickable area from 1px to 7px
  '&:before': {
    position: 'absolute',
    width: '7px',
    left: '-3px',
    top: 0,
    bottom: 0,
    content: '" "',
    zIndex: 1, // without zIndex, only the left side is clickable
  },
}));
