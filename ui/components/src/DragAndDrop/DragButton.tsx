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

import { IconButton, IconButtonProps, Menu, MenuItem, MenuProps } from '@mui/material';
import DragIcon from 'mdi-material-ui/Drag';
import { useState, MouseEvent, ReactElement } from 'react';

export function handleMoveUp<T>(element: T, elements: T[]): T[] {
  const index = elements.indexOf(element);
  if (index === 0) {
    return elements;
  }

  const newElements = [...elements];
  newElements.splice(index, 1);
  newElements.splice(index - 1, 0, element);
  return newElements;
}

export function handleMoveDown<T>(element: T, elements: T[]): T[] {
  const index = elements.indexOf(element);
  if (index === elements.length - 1) {
    return elements;
  }

  const newElements = [...elements];
  newElements.splice(index, 1);
  newElements.splice(index + 1, 0, element);
  return newElements;
}

export interface DragButtonProps extends IconButtonProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  menuSx?: MenuProps['sx'];
}

export function DragButton({ onMoveUp, onMoveDown, onMoveLeft, onMoveRight, menuSx }: DragButtonProps): ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  function handleClick(event: MouseEvent<HTMLElement>): void {
    setAnchorEl(event.currentTarget);
  }

  function handleMove(callback?: () => void): void {
    setAnchorEl(null);
    callback?.();
  }

  return (
    <>
      <IconButton aria-label="move" aria-haspopup={true} aria-expanded={open} size="small" onClick={handleClick}>
        <DragIcon />
      </IconButton>
      {(onMoveUp || onMoveDown || onMoveLeft || onMoveRight) && (
        <Menu
          id="drag-button-menu"
          MenuListProps={{
            'aria-labelledby': 'drag-button-menu',
          }}
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleMove(undefined)}
          sx={menuSx}
        >
          {onMoveUp && <MenuItem onClick={() => handleMove(onMoveUp)}>Move Up</MenuItem>}
          {onMoveDown && <MenuItem onClick={() => handleMove(onMoveDown)}>Move Down</MenuItem>}
          {onMoveLeft && <MenuItem onClick={() => handleMove(onMoveLeft)}>Move Left</MenuItem>}
          {onMoveRight && <MenuItem onClick={() => handleMove(onMoveRight)}>Move Right</MenuItem>}
          {onMoveRight && <MenuItem onClick={() => handleMove(onMoveRight)}>Move Right</MenuItem>}
        </Menu>
      )}
    </>
  );
}
