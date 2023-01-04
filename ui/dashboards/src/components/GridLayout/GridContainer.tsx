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

import { useEffect, useState } from 'react';
import { styled } from '@mui/material';

export interface GridContainerProps {
  children: React.ReactNode;
}

export function GridContainer(props: GridContainerProps) {
  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
    }
  }, [isFirstRender]);

  return (
    <ReactGridLayoutContainer
      sx={{
        // This adds spcing between grids (rows) in the overall dashboard
        '& + &': { marginTop: (theme) => theme.spacing(1) },
        // This disables the animation of grid items when a grid is first rendered
        // (see https://github.com/react-grid-layout/react-grid-layout/issues/103)
        '& .react-grid-item.cssTransforms': { transitionProperty: isFirstRender ? 'none' : 'transform' },
      }}
      data-testid="panel-group"
    >
      {props.children}
    </ReactGridLayoutContainer>
  );
}

/**
 * These are the classes needed by react-grid-layout from their CSS stylesheet.
 */
const ReactGridLayoutContainer = styled('section')(({ theme }) => ({
  '& .react-grid-layout': {
    position: 'relative',
    transition: 'height 200ms ease',
  },
  '& .react-grid-item': {
    transition: 'all 200ms ease',
    transitionProperty: 'left, top',
  },
  '& .react-grid-item img': {
    pointerEvents: 'none',
    userSelect: 'none',
  },
  '& .react-grid-item.cssTransforms': {
    transitionProperty: 'transform',
  },
  '& .react-grid-item.resizing': {
    zIndex: 1,
    willChange: 'width, height',
  },
  '& .react-grid-item.react-draggable-dragging': {
    transition: 'none',
    zIndex: 3,
    willChange: 'transform',
  },
  '& .react-grid-item.dropping': {
    visibility: 'hidden',
  },
  '& .react-grid-item.react-grid-placeholder': {
    background: theme.palette.primary.main,
    opacity: 0.2,
    transitionDuration: '100ms',
    zIndex: 2,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    OUserSelect: 'none',
  },

  '& .react-grid-item > .react-resizable-handle': {
    position: 'absolute',
    width: '20px',
    height: '20px',
  },
  '& .react-grid-item > .react-resizable-handle::after': {
    content: '""',
    position: 'absolute',
    right: '3px',
    bottom: '3px',
    width: '5px',
    height: '5px',
    borderRight: `2px solid ${theme.palette.text.secondary}`,
    borderBottom: `2px solid ${theme.palette.text.secondary}`,
  },

  '& .react-resizable-hide > .react-resizable-handle': {
    display: 'none',
  },

  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-sw': {
    bottom: '0',
    left: '0',
    cursor: 'sw-resize',
    transform: 'rotate(90deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-se': {
    bottom: '0',
    right: '0',
    cursor: 'se-resize',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-nw': {
    top: '0',
    left: '0',
    cursor: 'nw-resize',
    transform: 'rotate(180deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-ne': {
    top: '0',
    right: '0',
    cursor: 'ne-resize',
    transform: 'rotate(270deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-w, &.react-grid-item > .react-resizable-handle.react-resizable-handle-e':
    {
      top: '50%',
      marginTop: '-10px',
      cursor: 'ew-resize',
    },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-w': {
    left: '0',
    transform: 'rotate(135deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-e': {
    right: '0',
    transform: 'rotate(315deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-n, &.react-grid-item > .react-resizable-handle.react-resizable-handle-s':
    {
      left: '50%',
      marginLeft: '-10px',
      cursor: 'ns-resize',
    },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-n': {
    top: '0',
    transform: 'rotate(225deg)',
  },
  '& .react-grid-item > .react-resizable-handle.react-resizable-handle-s': {
    bottom: '0',
    transform: 'rotate(45deg)',
  },
  '& .react-resizable': {
    position: 'relative',
  },
  '& .react-resizable-handle': {
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundRepeat: 'no-repeat',
    backgroundOrigin: 'content-box',
    boxSizing: 'border-box',
    backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDYiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiNmZmZmZmYwMCIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI2cHgiIGhlaWdodD0iNnB4Ij48ZyBvcGFjaXR5PSIwLjMwMiI+PHBhdGggZD0iTSA2IDYgTCAwIDYgTCAwIDQuMiBMIDQgNC4yIEwgNC4yIDQuMiBMIDQuMiAwIEwgNiAwIEwgNiA2IEwgNiA2IFoiIGZpbGw9IiMwMDAwMDAiLz48L2c+PC9zdmc+')`,
    backgroundPosition: 'bottom right',
    padding: '0 3px 3px 0',
  },
  '& .react-resizable-handle-sw': {
    bottom: '0',
    left: '0',
    cursor: 'sw-resize',
    transform: 'rotate(90deg)',
  },
  '& .react-resizable-handle-se': {
    bottom: '0',
    right: '0',
    cursor: 'se-resize',
  },
  '& .react-resizable-handle-nw': {
    top: '0',
    left: '0',
    cursor: 'nw-resize',
    transform: 'rotate(180deg)',
  },
  '& .react-resizable-handle-ne': {
    top: '0',
    right: '0',
    cursor: 'ne-resize',
    transform: 'rotate(270deg)',
  },
  '& .react-resizable-handle-w, .react-resizable-handle-e': {
    top: '50%',
    marginTop: '-10px',
    cursor: 'ew-resize',
  },
  '& .react-resizable-handle-w': {
    left: '0',
    transform: 'rotate(135deg)',
  },
  '& .react-resizable-handle-e': {
    right: '0',
    transform: 'rotate(315deg)',
  },
  '& .react-resizable-handle-n, .react-resizable-handle-s': {
    left: '50%',
    marginLeft: '-10px',
    cursor: 'ns-resize',
  },
  '& .react-resizable-handle-n': {
    top: '0',
    transform: 'rotate(225deg)',
  },
  '& .react-resizable-handle-s': {
    bottom: '0',
    transform: 'rotate(45deg)',
  },
}));
