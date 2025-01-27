// Copyright 2025 The Perses Authors
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

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/pages/query/TreeNode.tsx

import { Box, CircularProgress, List, ListItem, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import CircleIcon from 'mdi-material-ui/Circle';
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import AlertCircle from 'mdi-material-ui/AlertCircle';
import { StatusError } from '@perses-dev/core';
import { PrometheusDatasourceSelector } from '../model';
import ASTNode, { nodeType } from './promql/ast';
import { escapeString, getNodeChildren } from './promql/utils';
import { formatNode } from './promql/format';
import serializeNode from './promql/serialize';
import { functionSignatures } from './promql/functionSignatures';
import { useInstantQuery } from './query';

// The indentation factor for each level of the tree.
const nodeIndent = 5;
const connectorWidth = nodeIndent * 5;

// max number of label names and values to show in the individual query status
const maxLabelNames = 10;
const maxLabelValues = 10;

type NodeState = 'waiting' | 'running' | 'error' | 'success';

// mergeChildStates basically returns the "worst" state found among the children.
const mergeChildStates = (states: NodeState[]): NodeState => {
  if (states.includes('error')) {
    return 'error';
  }
  if (states.includes('waiting')) {
    return 'waiting';
  }
  if (states.includes('running')) {
    return 'running';
  }

  return 'success';
};

interface TreeNodeProps {
  // The AST node to render.
  node: ASTNode;
  // The parent element of this node.
  parentEl?: HTMLDivElement | null;
  // Used to compute the position of the connector line between this node and its parent.
  reverse: boolean;
  // Datasource used for the node's individual query.
  datasource: PrometheusDatasourceSelector;
  // The index of this node in its parent's children.
  // Used to render the node's individual query.
  childIdx: number;
  // Function to report the node state to the parent.
  // Used to render the node's individual query.
  reportNodeState?: (childIdx: number, state: NodeState) => void;
}

export default function TreeNode({
  node,
  parentEl,
  reverse,
  datasource,
  childIdx,
  reportNodeState,
}: TreeNodeProps): ReactElement {
  const theme = useTheme();
  const children = getNodeChildren(node);

  // A normal ref won't work properly here because the ref's `current` property
  // going from `null` to defined won't trigger a re-render of the child
  // component, since it's not a React state update. So we manually have to
  // create a state update using a callback ref. See also
  // https://tkdodo.eu/blog/avoiding-use-effect-with-callback-refs
  const [nodeEl, setNodeEl] = useState<HTMLDivElement | null>(null);
  const nodeRef = useCallback((node: HTMLDivElement) => setNodeEl(node), []);

  const [resultStats, setResultStats] = useState<{
    numSeries: number;
    labelExamples: Record<string, Array<{ value: string; count: number }>>;
    sortedLabelCards: Array<[string, number]>;
  }>({
    numSeries: 0,
    labelExamples: {},
    sortedLabelCards: [],
  });

  const [connectorStyle, setConnectorStyle] = useState({
    borderColor: theme.palette.grey['500'],
    borderLeftStyle: 'solid',
    borderLeftWidth: 2,
    width: connectorWidth,
    left: -connectorWidth,
  });

  const [childStates, setChildStates] = useState<NodeState[]>(children.map(() => 'waiting'));
  const mergedChildState = useMemo(() => mergeChildStates(childStates), [childStates]);

  // Optimize range vector selector fetches to give us the info we're looking for
  // more cheaply. E.g. 'foo[7w]' can be expensive to fully fetch, but wrapping it
  // in 'last_over_time(foo[7w])' is cheaper and also gives us all the info we
  // need (number of series and labels).
  let queryNode = node;
  if (queryNode.type === nodeType.matrixSelector) {
    queryNode = {
      type: nodeType.call,
      func: functionSignatures.last_over_time!,
      args: [node],
    };
  }

  // Individual query for the current node
  const {
    data: instantQueryResponse,
    isFetching,
    error,
  } = useInstantQuery(serializeNode(queryNode) ?? '', datasource, mergedChildState === 'success');

  // report the node state to the parent
  useEffect(() => {
    if (reportNodeState) {
      if (mergedChildState === 'error' || error) {
        reportNodeState(childIdx, 'error');
      } else if (isFetching) {
        reportNodeState(childIdx, 'running');
      }
    }
  }, [mergedChildState, error, isFetching, reportNodeState, childIdx]);

  // This function is passed down to the child nodes so they can report their state.
  const childReportNodeState = useCallback(
    (childIdx: number, state: NodeState) => {
      setChildStates((prev) => {
        const newStates = [...prev];
        newStates[childIdx] = state;
        return newStates;
      });
    },
    [setChildStates]
  );

  // Update the size and position of tree connector lines based on the node's and its parent's position.
  useLayoutEffect(() => {
    if (parentEl === undefined) {
      // We're the root node.
      return;
    }

    if (parentEl === null || nodeEl === null) {
      // Either of the two connected nodes hasn't been rendered yet.
      return;
    }

    const parentRect = parentEl.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();
    if (reverse) {
      setConnectorStyle((prevStyle) => ({
        ...prevStyle,
        top: 'calc(50% - 1px)',
        bottom: nodeRect.bottom - parentRect.top,
        borderTopLeftRadius: 10,
        borderTopStyle: 'solid',
        borderBottomLeftRadius: undefined,
      }));
    } else {
      setConnectorStyle((prevStyle) => ({
        ...prevStyle,
        top: parentRect.bottom - nodeRect.top,
        bottom: 'calc(50% - 1px)',
        borderBottomLeftRadius: 10,
        borderBottomStyle: 'solid',
        borderTopLeftRadius: undefined,
      }));
    }
  }, [parentEl, nodeEl, reverse, nodeRef, setConnectorStyle]);

  // Update the node info state based on the query result.
  useEffect(() => {
    if (instantQueryResponse?.status !== 'success') {
      return;
    }

    if (reportNodeState) {
      reportNodeState(childIdx, 'success');
    }

    let resultSeries = 0;
    // labelValuesByName records the number of times each label value appears for each label name.
    const labelValuesByName: Record<string, Record<string, number>> = {};
    const { resultType, result } = instantQueryResponse.data;

    if (resultType === 'scalar' || resultType === 'string') {
      resultSeries = 1;
    } else if (result && result.length > 0) {
      resultSeries = result.length;
      result.forEach((s) => {
        Object.entries(s.metric).forEach(([ln, lv]) => {
          // TODO: If we ever want to include __name__ here again, we cannot use the
          // last_over_time(foo[7d]) optimization since that removes the metric name.
          if (ln !== '__name__') {
            labelValuesByName[ln] = labelValuesByName[ln] ?? {};
            labelValuesByName[ln]![lv] = (labelValuesByName[ln]![lv] ?? 0) + 1;
          }
        });
      });
    }

    // labelCardinalities records the number of unique label values for each label name.
    const labelCardinalities: Record<string, number> = {};
    // labelExamples records the most common label values for each label name.
    const labelExamples: Record<string, Array<{ value: string; count: number }>> = {};
    Object.entries(labelValuesByName).forEach(([ln, lvs]) => {
      labelCardinalities[ln] = Object.keys(lvs).length;
      // Sort label values by their number of occurrences within this label name.
      labelExamples[ln] = Object.entries(lvs)
        .sort(([, aCnt], [, bCnt]) => bCnt - aCnt)
        .slice(0, maxLabelValues)
        .map(([lv, cnt]) => ({ value: lv, count: cnt }));
    });

    setResultStats({
      numSeries: resultSeries,
      sortedLabelCards: Object.entries(labelCardinalities).sort((a, b) => b[1] - a[1]),
      labelExamples,
    });
  }, [instantQueryResponse, reportNodeState, childIdx]);

  const innerNode = (
    <Stack direction="row" gap={2}>
      <Box
        ref={nodeRef}
        sx={{
          position: 'relative',
          display: 'inline-block',
          padding: 1,
          marginBottom: 1.5,
          borderRadius: 2,
          backgroundColor: theme.palette.background.code,
        }}
      >
        {parentEl !== undefined && (
          // Connector line between this node and its parent.
          <Box
            sx={{
              position: 'absolute',
              display: 'inline-block',
              ...connectorStyle,
            }}
          />
        )}
        {/* The node (visible box) itself. */}
        {formatNode(node, false, 1)}
      </Box>
      {/* The node's individual query: */}
      <QueryStatus
        mergedChildState={mergedChildState}
        isFetching={isFetching}
        error={error}
        resultStats={resultStats}
        responseTime={instantQueryResponse?.responseTime}
      />
    </Stack>
  );

  if (node.type === nodeType.binaryExpr) {
    return (
      <div>
        <Box ml={nodeIndent}>
          <TreeNode
            node={children[0]!}
            parentEl={nodeEl}
            reverse={true}
            datasource={datasource}
            childIdx={0}
            reportNodeState={childReportNodeState}
          />
        </Box>
        {innerNode}
        <Box ml={nodeIndent}>
          <TreeNode
            node={children[1]!}
            parentEl={nodeEl}
            reverse={false}
            datasource={datasource}
            childIdx={1}
            reportNodeState={childReportNodeState}
          />
        </Box>
      </div>
    );
  }

  return (
    <div>
      {innerNode}
      {children.map((child, idx) => (
        <Box ml={nodeIndent} key={idx}>
          <TreeNode
            node={child}
            parentEl={nodeEl}
            reverse={false}
            datasource={datasource}
            childIdx={idx}
            reportNodeState={childReportNodeState}
          />
        </Box>
      ))}
    </div>
  );
}

interface QueryStatusProps {
  mergedChildState: NodeState;
  isFetching: boolean;
  error: StatusError | null;
  resultStats: {
    numSeries: number;
    labelExamples: Record<string, Array<{ value: string; count: number }>>;
    sortedLabelCards: Array<[string, number]>;
  };
  responseTime?: number;
}

function QueryStatus({
  mergedChildState,
  isFetching,
  error,
  resultStats,
  responseTime,
}: QueryStatusProps): ReactElement {
  if (mergedChildState === 'waiting') {
    return <ProgressState text="Waiting for child query" />;
  }

  if (mergedChildState === 'running') {
    return <ProgressState text="Running" />;
  }

  if (mergedChildState === 'error') {
    return (
      <Stack>
        <AlertCircle />
        Blocked on child query error
      </Stack>
    );
  }

  if (isFetching) {
    return <ProgressState text="Loading" />;
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{ color: (theme) => theme.palette.error.main }}
        marginBottom={1.5}
      >
        <AlertCircle />
        <Typography variant="body2">
          <strong>Error executing query:</strong> {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack direction="row" gap={1} alignItems="center" marginBottom={1.5}>
      <Typography variant="body2" component="span" sx={{ color: (theme) => theme.palette.grey[500] }}>
        {resultStats.numSeries} result{resultStats.numSeries !== 1 && 's'}
        &nbsp;&nbsp;–&nbsp;&nbsp;
        {responseTime}ms
        {resultStats.sortedLabelCards.length > 0 && <>&nbsp;&nbsp;–</>}
      </Typography>
      {resultStats.sortedLabelCards.slice(0, maxLabelNames).map(([ln, cnt]) => (
        <Tooltip
          key={ln}
          title={
            <Box>
              <List dense>
                {resultStats.labelExamples[ln]?.map(({ value, count }) => (
                  <ListItem
                    key={value}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      py: 0,
                      px: 0.5,
                    }}
                  >
                    <CircleIcon sx={{ fontSize: 8 }} />
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: (theme) =>
                          theme.palette.mode === 'dark' // TODO we shouldnt have to do that I guess..
                            ? theme.palette.warning.dark
                            : theme.palette.warning.main,
                        fontFamily: 'monospace',
                      }}
                    >
                      {escapeString(value)}
                    </Typography>
                    <Typography variant="body2" component="span">
                      ({count}x)
                    </Typography>
                  </ListItem>
                ))}
                {cnt > maxLabelValues && (
                  <ListItem
                    sx={{
                      display: 'flex',
                      gap: 1,
                      py: 0,
                      px: 0.5,
                    }}
                  >
                    <CircleIcon sx={{ fontSize: 8 }} />
                    <Typography variant="body2">. . .</Typography>
                  </ListItem>
                )}
              </List>
            </Box>
          }
          arrow
        >
          <span style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Typography
              variant="body2"
              component="span"
              sx={{ fontFamily: 'monospace', color: (theme) => theme.palette.success.main }}
            >
              {ln}
            </Typography>
            <Typography variant="body2" component="span" sx={{ color: (theme) => theme.palette.grey[500] }}>
              : {cnt}
            </Typography>
          </span>
        </Tooltip>
      ))}
      {resultStats.sortedLabelCards.length > maxLabelNames ? (
        <Typography variant="body2">...{resultStats.sortedLabelCards.length - maxLabelNames} more...</Typography>
      ) : null}
    </Stack>
  );
}

function ProgressState({ text }: { text: string }): ReactElement {
  return (
    <Box display="flex" alignItems="center" gap={1} marginBottom={1.5}>
      <CircularProgress size={16} color="secondary" />
      <Typography variant="body2" color="text.secondary">
        {text}...
      </Typography>
    </Box>
  );
}
