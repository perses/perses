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

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/promql/utils.ts

import ASTNode, { binaryOperatorType, nodeType } from './ast';

const binOpPrecedence = {
  [binaryOperatorType.add]: 3,
  [binaryOperatorType.sub]: 3,
  [binaryOperatorType.mul]: 2,
  [binaryOperatorType.div]: 2,
  [binaryOperatorType.mod]: 2,
  [binaryOperatorType.pow]: 1,
  [binaryOperatorType.eql]: 4,
  [binaryOperatorType.neq]: 4,
  [binaryOperatorType.gtr]: 4,
  [binaryOperatorType.lss]: 4,
  [binaryOperatorType.gte]: 4,
  [binaryOperatorType.lte]: 4,
  [binaryOperatorType.and]: 5,
  [binaryOperatorType.or]: 6,
  [binaryOperatorType.unless]: 5,
  [binaryOperatorType.atan2]: 2,
};

export const maybeParenthesizeBinopChild = (op: binaryOperatorType, child: ASTNode): ASTNode => {
  if (child.type !== nodeType.binaryExpr) {
    return child;
  }

  if (binOpPrecedence[op] > binOpPrecedence[child.op]) {
    return child;
  }

  // TODO: Parens aren't necessary for left-associativity within same precedence,
  // or right-associativity between two power operators.
  return {
    type: nodeType.parenExpr,
    expr: child,
  };
};

export const getNodeChildren = (node: ASTNode): ASTNode[] => {
  switch (node.type) {
    case nodeType.aggregation:
      return node.param === null ? [node.expr] : [node.param, node.expr];
    case nodeType.subquery:
      return [node.expr];
    case nodeType.parenExpr:
      return [node.expr];
    case nodeType.call:
      return node.args;
    case nodeType.matrixSelector:
    case nodeType.vectorSelector:
    case nodeType.numberLiteral:
    case nodeType.stringLiteral:
      return [];
    case nodeType.placeholder:
      return node.children;
    case nodeType.unaryExpr:
      return [node.expr];
    case nodeType.binaryExpr:
      return [node.lhs, node.rhs];
    default:
      throw new Error('unsupported node type');
  }
};

export const aggregatorsWithParam = ['topk', 'bottomk', 'quantile', 'count_values', 'limitk', 'limit_ratio'];

export const escapeString = (str: string): string => {
  return str.replace(/([\\"])/g, '\\$1');
};
