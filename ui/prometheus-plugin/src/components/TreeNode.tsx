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

import { Box } from '@mui/material';
import ASTNode, { nodeType } from './promql/ast';
import { getNodeChildren } from './promql/utils';
import { formatNode } from './promql/format';

const nodeIndent = 20;

interface TreeNodeProps {
  node: ASTNode;
  // selectedNode: { id: string; node: ASTNode } | null;
  // setSelectedNode: (Node: { id: string; node: ASTNode } | null) => void;
  // parentEl?: HTMLDivElement | null;
  // reportNodeState?: (childIdx: number, state: NodeState) => void;
  reverse: boolean;
  // The index of this node in its parent's children.
  childIdx: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, reverse, childIdx }) => {
  const children = getNodeChildren(node);
  const innerNode = <Box>{formatNode(node, false, 1)}</Box>;

  if (node.type === nodeType.binaryExpr) {
    return (
      <div>
        <Box ml={nodeIndent}>
          <TreeNode node={children[0]!} reverse={true} childIdx={0} />
        </Box>
        {innerNode}
        <Box ml={nodeIndent}>
          <TreeNode node={children[1]!} reverse={false} childIdx={1} />
        </Box>
      </div>
    );
  }

  return (
    <div>
      {innerNode}
      {children.map((child, idx) => (
        <Box ml={nodeIndent} key={idx}>
          <TreeNode node={child} reverse={false} childIdx={idx} />
        </Box>
      ))}
    </div>
  );
};

export default TreeNode;
