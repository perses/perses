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
import { styled } from '@mui/material';
import { formatDuration, msToPrometheusDuration } from '@perses-dev/core';
import ASTNode, {
  VectorSelector,
  matchType,
  vectorMatchCardinality,
  nodeType,
  StartOrEnd,
  MatrixSelector,
} from './ast';
import { maybeParenthesizeBinopChild, escapeString } from './utils';

// Styled components that reproduce the theming of CodeMirror:

const PromQLCode = styled('span')(() => ({
  fontFamily: '"DejaVu Sans Mono", monospace',
}));

const PromQLKeyword = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#e5c07b' : '#708',
}));

const PromQLFunction = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#61afef' : '#2a2e42',
}));

const PromQLMetricName = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#e06c75' : '#2a2e42',
}));

const PromQLLabelName = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#61afef' : '#219',
}));

const PromQLString = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#98c379' : '#a31515',
}));

const PromQLEllipsis = styled('span')(() => ({
  color: '#aaaaaa', // Same color for both modes as in the original CSS
}));

const PromQLDuration = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#e5c07b' : '#09885a',
}));

const PromQLNumber = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#e5c07b' : '#164',
}));

const PromQLOperator = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#56b6c2' : '#708',
}));

export const labelNameList = (labels: string[]): React.ReactNode[] => {
  return labels.map((l, i) => {
    return (
      <span key={i}>
        {i !== 0 && ', '}
        <PromQLLabelName>{l}</PromQLLabelName>
      </span>
    );
  });
};

const formatAtAndOffset = (timestamp: number | null, startOrEnd: StartOrEnd, offset: number): ReactNode => (
  <>
    {timestamp !== null ? (
      <>
        {' '}
        <PromQLOperator>@</PromQLOperator> <PromQLNumber>{(timestamp / 1000).toFixed(3)}</PromQLNumber>
      </>
    ) : startOrEnd !== null ? (
      <>
        {' '}
        <PromQLOperator>@</PromQLOperator> <PromQLKeyword>{startOrEnd}</PromQLKeyword>
        <span>(</span>
        <span>)</span>
      </>
    ) : (
      <></>
    )}
    {offset === 0 ? (
      <></>
    ) : offset > 0 ? (
      <>
        {' '}
        <PromQLKeyword>offset</PromQLKeyword>{' '}
        <PromQLDuration>{formatDuration(msToPrometheusDuration(offset))}</PromQLDuration>
      </>
    ) : (
      <>
        {' '}
        <PromQLKeyword>offset</PromQLKeyword>{' '}
        <PromQLDuration>-{formatDuration(msToPrometheusDuration(-offset))}</PromQLDuration>
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
        <PromQLLabelName>{m.name}</PromQLLabelName>
        {m.type}
        <PromQLString>&quot;{escapeString(m.value)}&quot;</PromQLString>
      </span>
    ));

  return (
    <>
      <PromQLMetricName>{node.name}</PromQLMetricName>
      {matchLabels.length > 0 && (
        <>
          {'{'}
          <span>{matchLabels}</span>
          {'}'}
        </>
      )}
      {node.type === nodeType.matrixSelector && (
        <>
          [<PromQLDuration>{formatDuration(msToPrometheusDuration(node.range))}</PromQLDuration>]
        </>
      )}
      {formatAtAndOffset(node.timestamp, node.startOrEnd, node.offset)}
    </>
  );
};

const ellipsis = <PromQLEllipsis>…</PromQLEllipsis>;

const formatNodeInternal = (node: ASTNode, showChildren: boolean, maxDepth?: number): React.ReactNode => {
  if (maxDepth === 0) {
    return ellipsis;
  }

  const childMaxDepth = maxDepth === undefined ? undefined : maxDepth - 1;

  switch (node.type) {
    case nodeType.aggregation:
      return (
        <>
          <PromQLOperator>{node.op}</PromQLOperator>
          {node.without ? (
            <>
              {' '}
              <PromQLKeyword>without</PromQLKeyword>
              <span>(</span>
              {labelNameList(node.grouping)}
              <span>)</span>{' '}
            </>
          ) : (
            node.grouping.length > 0 && (
              <>
                {' '}
                <PromQLKeyword>by</PromQLKeyword>
                <span>(</span>
                {labelNameList(node.grouping)}
                <span>)</span>{' '}
              </>
            )
          )}
          {showChildren && (
            <>
              <span>(</span>
              {node.param !== null && <>{formatNode(node.param, showChildren, childMaxDepth)}, </>}
              {formatNode(node.expr, showChildren, childMaxDepth)}
              <span>)</span>
            </>
          )}
        </>
      );
    case nodeType.subquery:
      return (
        <>
          {showChildren && formatNode(node.expr, showChildren, childMaxDepth)}[
          <PromQLDuration>{formatDuration(msToPrometheusDuration(node.range))}</PromQLDuration>:
          {node.step !== 0 && <PromQLDuration>{formatDuration(msToPrometheusDuration(node.step))}</PromQLDuration>}]
          {formatAtAndOffset(node.timestamp, node.startOrEnd, node.offset)}
        </>
      );
    case nodeType.parenExpr:
      return (
        <>
          <span>(</span>
          {showChildren && formatNode(node.expr, showChildren, childMaxDepth)}
          <span>)</span>
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
          <PromQLFunction>{node.func.name}</PromQLFunction>
          {showChildren && (
            <>
              <span>(</span>
              {children}
              <span>)</span>
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
      return <PromQLNumber>{node.val}</PromQLNumber>;
    case nodeType.stringLiteral:
      return <PromQLString>&quot;{escapeString(node.val)}&quot;</PromQLString>;
    case nodeType.unaryExpr:
      return (
        <>
          <PromQLOperator>{node.op}</PromQLOperator>
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
              <PromQLKeyword>on</PromQLKeyword>
              <span>(</span>
              {labelNameList(vm.labels)}
              <span>)</span>
            </>
          );
        } else {
          matching = (
            <>
              {' '}
              <PromQLKeyword>ignoring</PromQLKeyword>
              <span>(</span>
              {labelNameList(vm.labels)}
              <span>)</span>
            </>
          );
        }

        if (vm.card === vectorMatchCardinality.manyToOne || vm.card === vectorMatchCardinality.oneToMany) {
          grouping = (
            <>
              <PromQLKeyword>
                {' '}
                group_
                {vm.card === vectorMatchCardinality.manyToOne ? 'left' : 'right'}
              </PromQLKeyword>
              <span>(</span>
              {labelNameList(vm.include)}
              <span>)</span>
            </>
          );
        }
      }

      return (
        <>
          {showChildren && formatNode(maybeParenthesizeBinopChild(node.op, node.lhs), showChildren, childMaxDepth)}{' '}
          {['atan2', 'and', 'or', 'unless'].includes(node.op) ? (
            <PromQLOperator>{node.op}</PromQLOperator>
          ) : (
            <PromQLOperator>{node.op}</PromQLOperator>
          )}
          {node.bool && (
            <>
              {' '}
              <PromQLKeyword>bool</PromQLKeyword>
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
  <PromQLCode>{formatNodeInternal(node, showChildren, maxDepth)}</PromQLCode>
);
