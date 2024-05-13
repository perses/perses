// Copyright (c) 2018 Uber Technologies, Inc.
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

import * as React from 'react';
import { Dropdown, Button } from 'antd';
import { IoChevronDown } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import './AltViewOptions.css';

import prefixUrl from '../../../utils/prefix-url';
import { ETraceViewType } from '../types';
import { getTargetBlankOrTop } from '../../../utils/config/get-target';

type Props = {
  onTraceViewChange: (viewType: ETraceViewType) => void;
  traceID: string;
  disableJsonView: boolean;
  viewType: ETraceViewType;
};

const MENU_ITEMS = [
  {
    viewType: ETraceViewType.TraceTimelineViewer,
    label: 'Trace Timeline',
  },
  {
    viewType: ETraceViewType.TraceGraph,
    label: 'Trace Graph',
  },
  {
    viewType: ETraceViewType.TraceStatistics,
    label: 'Trace Statistics',
  },
  {
    viewType: ETraceViewType.TraceSpansView,
    label: 'Trace Spans Table',
  },
  {
    viewType: ETraceViewType.TraceFlamegraph,
    label: 'Trace Flamegraph',
  },
];

export default function AltViewOptions(props: Props) {
  const { onTraceViewChange, viewType, traceID, disableJsonView } = props;

  const handleSelectView = (item: ETraceViewType) => {
    onTraceViewChange(item);
  };

  const dropdownItems = [
    ...MENU_ITEMS.filter(item => item.viewType !== viewType).map(item => ({
      key: item.viewType as ETraceViewType | string,
      label: (
        <a onClick={() => handleSelectView(item.viewType)} role="button">
          {item.label}
        </a>
      ),
    })),
  ];
  if (!disableJsonView) {
    dropdownItems.push(
      {
        key: 'trace-json',
        label: (
          <Link
            to={prefixUrl(`/api/traces/${traceID}?prettyPrint=true`)}
            rel="noopener noreferrer"
            target={getTargetBlankOrTop()}
          >
            Trace JSON
          </Link>
        ),
      },
      {
        key: 'trace-json-unadjusted',
        label: (
          <Link
            to={prefixUrl(`/api/traces/${traceID}?raw=true&prettyPrint=true`)}
            rel="noopener noreferrer"
            target={getTargetBlankOrTop()}
          >
            Trace JSON (unadjusted)
          </Link>
        ),
      }
    );
  }

  const currentItem = MENU_ITEMS.find(item => item.viewType === viewType);
  const dropdownText = currentItem ? currentItem.label : 'Alternate Views';
  return (
    <Dropdown menu={{ items: dropdownItems }}>
      <Button className="AltViewOptions">
        {`${dropdownText} `}
        <IoChevronDown />
      </Button>
    </Dropdown>
  );
}
