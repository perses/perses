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

import { MouseEvent as ReactMouseEvent, ReactElement, useEffect, useState } from 'react';
import { Box, styled } from '@mui/material';
import { useEvent } from '@perses-dev/core';

interface ResizableDividerProps {
  parentRef: React.RefObject<Element>;
  spacing?: number;
  onMove: (left: number) => void;
}

export function ResizableDivider(props: ResizableDividerProps): ReactElement {
  const { parentRef, spacing = 0, onMove } = props;
  const [isResizing, setResizing] = useState(false);

  const handleMouseDown = (e: ReactMouseEvent): void => {
    // disable any default actions (text selection, etc.)
    e.preventDefault();

    setResizing(true);
  };

  // need stable reference for window.removeEventListener() in useEffect() below
  const handleMouseMove = useEvent((e: MouseEvent) => {
    if (!parentRef.current) return;

    const offsetX = e.clientX - parentRef.current.getBoundingClientRect().left + spacing;
    const leftPercent = offsetX / parentRef.current.getBoundingClientRect().width;

    if (0.05 <= leftPercent && leftPercent <= 0.95) {
      onMove(leftPercent);
    }
  });

  // need stable reference for window.removeEventListener() in useEffect() below
  const handleMouseUp = useEvent(() => {
    setResizing(false);
  });

  // capture mouseMove and mouseUp outside the element by attaching them to the window object
  useEffect(() => {
    function startMouseAction(): void {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    function stopMouseAction(): void {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'inherit';
    }

    if (isResizing) {
      startMouseAction();
    } else {
      stopMouseAction();
    }

    return stopMouseAction;
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // prevent onClick event when clicking on a divider
  const stopEventPropagation = (e: ReactMouseEvent): void => e.stopPropagation();

  return <ResizableDividerBox onMouseDown={handleMouseDown} onClick={stopEventPropagation} />;
}

const ResizableDividerBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '1px',
  height: '100%',
  backgroundColor: theme.palette.divider,
  cursor: 'col-resize',

  // increase clickable area from 1px to 7px
  '&:before': {
    position: 'absolute',
    width: '7px',
    left: '-3px',
    top: 0,
    bottom: 0,
    content: '" "',
    zIndex: 1, // without zIndex, the span duration row hides the right side of this element
  },
}));
