// Copyright (c) 2017 Uber Technologies, Inc.
//
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

import React, { useState } from 'react';
import { Popover, Tooltip } from 'antd';
import _groupBy from 'lodash/groupBy';

import AccordianLogs from './SpanDetail/AccordianLogs';

import { ViewedBoundsFunctionType } from './utils';
import { TNil } from '../../../types';
import { Span, criticalPathSection } from '../../../types/trace';

import './SpanBar.css';

type TCommonProps = {
  color: string;
  hintSide: string;
  // onClick: (evt: React.MouseEvent<any>) => void;
  onClick?: (evt: React.MouseEvent<any>) => void;
  criticalPath: criticalPathSection[];
  viewEnd: number;
  viewStart: number;
  getViewedBounds: ViewedBoundsFunctionType;
  rpc:
    | {
        viewStart: number;
        viewEnd: number;
        color: string;
      }
    | TNil;
  traceStartTime: number;
  span: Span;
  longLabel: string;
  shortLabel: string;
};

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function toPercentInDecimal(value: number) {
  return `${value * 100}%`;
}

function SpanBar(props: TCommonProps) {
  const {
    criticalPath,
    viewEnd,
    viewStart,
    getViewedBounds,
    color,
    hintSide,
    onClick,
    rpc,
    traceStartTime,
    span,
    shortLabel,
    longLabel,
  } = props;
  // group logs based on timestamps
  const logGroups = _groupBy(span.logs, log => {
    const posPercent = getViewedBounds(log.timestamp, log.timestamp).start;
    // round to the nearest 0.2%
    return toPercent(Math.round(posPercent * 500) / 500);
  });

  const [label, setLabel] = useState(shortLabel);

  const setShortLabel = () => {
    setLabel(shortLabel);
  };

  const setLongLabel = () => {
    setLabel(longLabel);
  };

  return (
    <div
      className="SpanBar--wrapper"
      onClick={onClick}
      onMouseOut={setShortLabel}
      onMouseOver={setLongLabel}
      aria-hidden
    >
      <div
        aria-label={label}
        className="SpanBar--bar"
        style={{
          background: color,
          left: toPercent(viewStart),
          width: toPercent(viewEnd - viewStart),
        }}
      >
        <div className={`SpanBar--label is-${hintSide}`}>{label}</div>
      </div>
      <div>
        {Object.keys(logGroups).map(positionKey => (
          <Popover
            key={positionKey}
            arrowPointAtCenter
            overlayClassName="SpanBar--logHint"
            placement="topLeft"
            content={
              <AccordianLogs
                interactive={false}
                isOpen
                logs={logGroups[positionKey]}
                timestamp={traceStartTime}
              />
            }
          >
            <div
              data-testid="SpanBar--logMarker"
              className="SpanBar--logMarker"
              style={{ left: positionKey, zIndex: 3 }}
            />
          </Popover>
        ))}
      </div>
      {rpc && (
        <div
          className="SpanBar--rpc"
          style={{
            background: rpc.color,
            left: toPercent(rpc.viewStart),
            width: toPercent(rpc.viewEnd - rpc.viewStart),
          }}
        />
      )}
      {criticalPath &&
        criticalPath.map((each, index) => {
          const critcalPathViewBounds = getViewedBounds(each.section_start, each.section_end);
          const criticalPathViewStart = critcalPathViewBounds.start;
          const criticalPathViewEnd = critcalPathViewBounds.end;
          const key = `${each.spanId}-${index}`;
          return (
            <Tooltip
              key={key}
              placement="top"
              title={
                <div>
                  A segment on the <em>critical path</em> of the overall trace/request/workflow.
                </div>
              }
            >
              <div
                data-testid="SpanBar--criticalPath"
                className="SpanBar--criticalPath"
                style={{
                  background: 'black',
                  left: toPercentInDecimal(criticalPathViewStart),
                  width: toPercentInDecimal(criticalPathViewEnd - criticalPathViewStart),
                }}
              />
            </Tooltip>
          );
        })}
    </div>
  );
}

export default SpanBar;
