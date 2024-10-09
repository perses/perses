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

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/promql/format.tsx

import React, { ReactElement, ReactNode } from 'react';
import ASTNode, {
  VectorSelector,
  matchType,
  vectorMatchCardinality,
  nodeType,
  StartOrEnd,
  MatrixSelector,
} from './ast';
import { maybeParenthesizeBinopChild, escapeString } from './utils';
import { formatPrometheusDuration } from './formatTime';

export const labelNameList = (labels: string[]): React.ReactNode[] => {
  return labels.map((l, i) => {
    return (
      <span key={i}>
        {i !== 0 && ', '}
        <span className="promql-code promql-label-name">{l}</span>
      </span>
    );
  });
};

const formatAtAndOffset = (timestamp: number | null, startOrEnd: StartOrEnd, offset: number): ReactNode => (
  <>
    {timestamp !== null ? (
      <>
        {' '}
        <span className="promql-operator">@</span>{' '}
        <span className="promql-number">{(timestamp / 1000).toFixed(3)}</span>
      </>
    ) : startOrEnd !== null ? (
      <>
        {' '}
        <span className="promql-operator">@</span> <span className="promql-keyword">{startOrEnd}</span>
        <span className="promql-paren">(</span>
        <span className="promql-paren">)</span>
      </>
    ) : (
      <></>
    )}
    {offset === 0 ? (
      <></>
    ) : offset > 0 ? (
      <>
        {' '}
        <span className="promql-keyword">offset</span>{' '}
        <span className="promql-duration">{formatPrometheusDuration(offset)}</span>
      </>
    ) : (
      <>
        {' '}
        <span className="promql-keyword">offset</span>{' '}
        <span className="promql-duration">-{formatPrometheusDuration(-offset)}</span>
      </>
    )}
  </>
);

const formatSelector = (node: VectorSelector | MatrixSelector): ReactElement => {
  const matchLabels = node.matchers
    .filter((m) => !(m.name === '__name__' && m.type === matchType.equal && m.value === node.name))
    .map((m, i) => (
      <span key={i}>
        {i !== 0 && ','}
        <span className="promql-label-name">{m.name}</span>
        {m.type}
        <span className="promql-string">&quot;{escapeString(m.value)}&quot;</span>
      </span>
    ));

  return (
    <>
      <span className="promql-metric-name">{node.name}</span>
      {matchLabels.length > 0 && (
        <>
          {'{'}
          <span className="promql-metric-name">{matchLabels}</span>
          {'}'}
        </>
      )}
      {node.type === nodeType.matrixSelector && (
        <>
          [<span className="promql-duration">{formatPrometheusDuration(node.range)}</span>]
        </>
      )}
      {formatAtAndOffset(node.timestamp, node.startOrEnd, node.offset)}
    </>
  );
};

const ellipsis = <span className="promql-ellipsis">…</span>;

const formatNodeInternal = (node: ASTNode, showChildren: boolean, maxDepth?: number): React.ReactNode => {
  if (maxDepth === 0) {
    return ellipsis;
  }

  const childMaxDepth = maxDepth === undefined ? undefined : maxDepth - 1;

  switch (node.type) {
    case nodeType.aggregation:
      return (
        <>
          <span className="promql-keyword">{node.op}</span>
          {node.without ? (
            <>
              {' '}
              <span className="promql-keyword">without</span>
              <span className="promql-paren">(</span>
              {labelNameList(node.grouping)}
              <span className="promql-paren">)</span>{' '}
            </>
          ) : (
            node.grouping.length > 0 && (
              <>
                {' '}
                <span className="promql-keyword">by</span>
                <span className="promql-paren">(</span>
                {labelNameList(node.grouping)}
                <span className="promql-paren">)</span>{' '}
              </>
            )
          )}
          {showChildren && (
            <>
              <span className="promql-paren">(</span>
              {node.param !== null && <>{formatNode(node.param, showChildren, childMaxDepth)}, </>}
              {formatNode(node.expr, showChildren, childMaxDepth)}
              <span className="promql-paren">)</span>
            </>
          )}
        </>
      );
    case nodeType.subquery:
      return (
        <>
          {showChildren && formatNode(node.expr, showChildren, childMaxDepth)}[
          <span className="promql-duration">{formatPrometheusDuration(node.range)}</span>:
          {node.step !== 0 && <span className="promql-duration">{formatPrometheusDuration(node.step)}</span>}]
          {formatAtAndOffset(node.timestamp, node.startOrEnd, node.offset)}
        </>
      );
    case nodeType.parenExpr:
      return (
        <>
          <span className="promql-paren">(</span>
          {showChildren && formatNode(node.expr, showChildren, childMaxDepth)}
          <span className="promql-paren">)</span>
        </>
      );
    case nodeType.call: {
      const children =
        childMaxDepth === undefined || childMaxDepth > 0
          ? node.args.map((arg, i) => (
              <span key={i}>
                {i !== 0 && ', '}
                {formatNode(arg, showChildren)}
              </span>
            ))
          : node.args.length > 0
            ? ellipsis
            : '';

      return (
        <>
          <span className="promql-keyword">{node.func.name}</span>
          {showChildren && (
            <>
              <span className="promql-paren">(</span>
              {children}
              <span className="promql-paren">)</span>
            </>
          )}
        </>
      );
    }
    case nodeType.matrixSelector:
      return formatSelector(node);
    case nodeType.vectorSelector:
      return formatSelector(node);
    case nodeType.numberLiteral:
      return <span className="promql-number">{node.val}</span>;
    case nodeType.stringLiteral:
      return <span className="promql-string">&quot;{escapeString(node.val)}&quot;</span>;
    case nodeType.unaryExpr:
      return (
        <>
          <span className="promql-operator">{node.op}</span>
          {showChildren && formatNode(node.expr, showChildren, childMaxDepth)}
        </>
      );
    case nodeType.binaryExpr: {
      let matching = <></>;
      let grouping = <></>;
      const vm = node.matching;
      if (vm !== null && (vm.labels.length > 0 || vm.on)) {
        if (vm.on) {
          matching = (
            <>
              {' '}
              <span className="promql-keyword">on</span>
              <span className="promql-paren">(</span>
              {labelNameList(vm.labels)}
              <span className="promql-paren">)</span>
            </>
          );
        } else {
          matching = (
            <>
              {' '}
              <span className="promql-keyword">ignoring</span>
              <span className="promql-paren">(</span>
              {labelNameList(vm.labels)}
              <span className="promql-paren">)</span>
            </>
          );
        }

        if (vm.card === vectorMatchCardinality.manyToOne || vm.card === vectorMatchCardinality.oneToMany) {
          grouping = (
            <>
              <span className="promql-keyword">
                {' '}
                group_
                {vm.card === vectorMatchCardinality.manyToOne ? 'left' : 'right'}
              </span>
              <span className="promql-paren">(</span>
              {labelNameList(vm.include)}
              <span className="promql-paren">)</span>
            </>
          );
        }
      }

      return (
        <>
          {showChildren && formatNode(maybeParenthesizeBinopChild(node.op, node.lhs), showChildren, childMaxDepth)}{' '}
          {['atan2', 'and', 'or', 'unless'].includes(node.op) ? (
            <span className="promql-keyword">{node.op}</span>
          ) : (
            <span className="promql-operator">{node.op}</span>
          )}
          {node.bool && (
            <>
              {' '}
              <span className="promql-keyword">bool</span>
            </>
          )}
          {matching}
          {grouping}{' '}
          {showChildren && formatNode(maybeParenthesizeBinopChild(node.op, node.rhs), showChildren, childMaxDepth)}
        </>
      );
    }
    case nodeType.placeholder:
      // TODO: Include possible children of placeholders somehow?
      return ellipsis;
    default:
      throw new Error('unsupported node type');
  }
};

export const formatNode = (node: ASTNode, showChildren: boolean, maxDepth?: number): React.ReactElement => (
  <span className="promql-code">{formatNodeInternal(node, showChildren, maxDepth)}</span>
);
