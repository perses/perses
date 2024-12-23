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

import { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import {
  monitorForElements,
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Stack } from '@mui/material';
import { idle, State } from './model';
import { DropIndicator } from './DropIndicator';

interface MonitorElementsProps {
  elements: Array<Record<string, unknown>>;
  accessKey: string;
  axis?: 'vertical' | 'horizontal';
  onChange: (elements: Array<Record<string, unknown>>) => void;
}

/**
 * This hook is responsible for monitoring the drag and drop of elements.
 * It will call the onChange function with the new order of elements when a drop is detected.
 *
 * @param elements - The list of elements to monitor
 * @param accessKey - The key to use to identify the elements (key of the object)
 * @param axis - The axis to monitor the drag and drop on
 * @param onChange - The function to call when a drop is detected
 */
export function useDragAndDropMonitor({
  elements,
  accessKey,
  axis = 'vertical',
  onChange,
}: MonitorElementsProps): void {
  return useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        const indexOfSource = elements.findIndex((column) => column[accessKey] === sourceData[accessKey]);
        const indexOfTarget = elements.findIndex((column) => column[accessKey] === targetData[accessKey]);

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        onChange(
          reorderWithEdge({
            list: elements,
            startIndex: indexOfSource,
            indexOfTarget,
            closestEdgeOfTarget,
            axis: axis,
          })
        );
      },
    });
  }, [accessKey, axis, elements, onChange]);
}

export interface DragAndDropElementProps {
  children: ReactNode;
  data: Record<string, unknown>;
}

/*
 * This component wraps the children that should be draggable
 */
export function DragAndDropElement({ children, data }: DragAndDropElementProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(idle);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    return combine(
      draggable({
        element,
        getInitialData() {
          return data;
        },
        onDragStart() {
          setState({ type: 'is-dragging' });
        },
        onDrop() {
          setState(idle);
        },
      }),
      dropTargetForElements({
        element,
        canDrop({ source }) {
          // not allowing dropping on yourself
          if (source.element === element) {
            return false;
          }
          // only allowing tasks to be dropped on me
          return true;
        },
        getData({ input }) {
          return attachClosestEdge(data, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          });
        },
        getIsSticky() {
          return true;
        },
        onDragEnter({ self }) {
          const closestEdge = extractClosestEdge(self.data);
          setState({ type: 'is-dragging-over', closestEdge });
        },
        onDrag({ self }) {
          const closestEdge = extractClosestEdge(self.data);

          // Only need to update react state if nothing has changed.
          // Prevents re-rendering.
          setState((current) => {
            if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
              return current;
            }
            return { type: 'is-dragging-over', closestEdge };
          });
        },
        onDragLeave() {
          setState(idle);
        },
        onDrop() {
          setState(idle);
        },
      })
    );
  }, [data]);

  return (
    <Stack ref={ref} spacing={1} style={{ opacity: state.type === 'is-dragging' ? 0.5 : 'unset' }}>
      {state.type === 'is-dragging-over' && state.closestEdge === 'top' ? <DropIndicator /> : null}
      {children}
      {state.type === 'is-dragging-over' && state.closestEdge === 'bottom' ? <DropIndicator /> : null}
    </Stack>
  );
}
