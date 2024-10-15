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

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/pages/query/TreeNode.tsx

import { Box, useTheme } from '@mui/material';
import { useCallback, useLayoutEffect, useState } from 'react';
import ASTNode, { nodeType } from './promql/ast';
import { getNodeChildren } from './promql/utils';
import { formatNode } from './promql/format';

// The indentation factor for each level of the tree.
const nodeIndent = 5;
const connectorWidth = nodeIndent * 5;

interface TreeNodeProps {
  // The AST node to render.
  node: ASTNode;
  // The parent element of this node.
  parentEl?: HTMLDivElement | null;
  // used to compute the position of the connector line between this node and its parent.
  reverse: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, parentEl, reverse }) => {
  const theme = useTheme();
  const children = getNodeChildren(node);

  // A normal ref won't work properly here because the ref's `current` property
  // going from `null` to defined won't trigger a re-render of the child
  // component, since it's not a React state update. So we manually have to
  // create a state update using a callback ref. See also
  // https://tkdodo.eu/blog/avoiding-use-effect-with-callback-refs
  const [nodeEl, setNodeEl] = useState<HTMLDivElement | null>(null);
  const nodeRef = useCallback((node: HTMLDivElement) => setNodeEl(node), []);

  const [connectorStyle, setConnectorStyle] = useState({
    borderColor: theme.palette.grey['500'],
    borderLeftStyle: 'solid',
    borderLeftWidth: 2,
    width: connectorWidth,
    left: -connectorWidth,
  });

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

  const innerNode = (
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
  );

  if (node.type === nodeType.binaryExpr) {
    return (
      <div>
        <Box ml={nodeIndent}>
          <TreeNode node={children[0]!} parentEl={nodeEl} reverse={true} />
        </Box>
        {innerNode}
        <Box ml={nodeIndent}>
          <TreeNode node={children[1]!} parentEl={nodeEl} reverse={false} />
        </Box>
      </div>
    );
  }

  return (
    <div>
      {innerNode}
      {children.map((child, idx) => (
        <Box ml={nodeIndent} key={idx}>
          <TreeNode node={child} parentEl={nodeEl} reverse={false} />
        </Box>
      ))}
    </div>
  );
};

export default TreeNode;
