import { ReactNode, useEffect, useRef, useState } from 'react';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import {
  monitorForElements,
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, Edge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Box, Stack } from '@mui/material';

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  // @ts-expect-error: wip
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

interface MonitorElementsProps {
  elements: Array<Record<string, unknown>>;
  accessKey: string;
  axis?: 'vertical' | 'horizontal';
  onChange: (elements: Array<Record<string, unknown>>) => void;
}

export function useDragAndDropMonitor({ elements, accessKey, axis = 'vertical', onChange }: MonitorElementsProps) {
  return useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        const indexOfSource = elements.findIndex(
          (column) => getNestedValue(column, accessKey) === getNestedValue(sourceData, accessKey)
        );
        const indexOfTarget = elements.findIndex(
          (column) => getNestedValue(column, accessKey) === getNestedValue(targetData, accessKey)
        );

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

type State =
  | {
      type: 'idle';
    }
  | {
      type: 'is-dragging';
    }
  | {
      type: 'is-dragging-over';
      closestEdge: Edge | null;
    };

const idle: State = { type: 'idle' };

export function DropIndicator() {
  return (
    <Stack direction="row" alignItems="center">
      <Box
        sx={{
          content: '""',
          width: 8,
          height: 8,
          boxSizing: 'border-box',
          position: 'absolute',
          backgroundColor: (theme) => theme.palette.background.default,
          border: (theme) => `2px solid ${theme.palette.info.main}`,
          borderRadius: '50%',
        }}
      ></Box>
      <Box
        sx={{
          content: '""',
          height: 2,
          background: (theme) => theme.palette.info.main,
          width: '100%',
        }}
      ></Box>
    </Stack>
  );
}

export interface DragAndDropElementProps {
  children: ReactNode;
  data: Record<string, unknown>;
}

export function DragAndDropElement({ children, data }: DragAndDropElementProps) {
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
