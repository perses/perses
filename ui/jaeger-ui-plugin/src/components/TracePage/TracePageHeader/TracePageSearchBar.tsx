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
import { Button, Input, InputRef, Tooltip } from 'antd';
import cx from 'classnames';
import { IoLocate, IoHelp, IoClose, IoChevronDown, IoChevronUp } from 'react-icons/io5';

import * as markers from './TracePageSearchBar.markers';
import UiFindInput from '../../common/UiFindInput';
import { TNil } from '../../../types';
import './TracePageSearchBar.css';

type TracePageSearchBarProps = {
  textFilter: string | TNil;
  prevResult: () => void;
  nextResult: () => void;
  clearSearch: () => void;
  focusUiFindMatches: () => void;
  resultCount: number;
  navigable: boolean;
};

export function TracePageSearchBarFn(props: TracePageSearchBarProps & { forwardedRef: React.Ref<InputRef> }) {
  const {
    clearSearch,
    focusUiFindMatches,
    forwardedRef,
    navigable,
    nextResult,
    prevResult,
    resultCount,
    textFilter,
  } = props;

  const count = textFilter ? <span className="TracePageSearchBar--count">{resultCount}</span> : null;

  const btnClass = cx('TracePageSearchBar--btn', { 'is-disabled': !textFilter });
  const uiFindInputInputProps = {
    'data-test': markers.IN_TRACE_SEARCH,
    className: 'TracePageSearchBar--bar ub-flex-auto',
    name: 'search',
    suffix: count,
  };

  const renderTooltip = () => {
    return (
      <div style={{ wordBreak: 'normal' }}>
        <p>
          This is an in-page search. Enter the query as a list of space-separated string terms. Each term is
          used in a substring match against any of the following data elements: service name, operation name,
          span ID, and key-value pairs in tags and logs. The spans that match any of the search terms will be
          highlighted.
        </p>
        <p>
          For exact phrase search surround the query in double quotes like{' '}
          <code>&quot;The quick brown fox&quot;</code>
        </p>
        <p>
          When matching key-value pairs, the substring search is applied separately against the key, the
          value, and the concatenated <code>&quot;key=value&quot;</code> string. The latter allows searching
          for exact matches like <code>http.status_code=200</code>.
        </p>
        <p>
          To preclude certain key-value pairs from participating in the matching, prefix the key with the
          minus <code>&apos;-&apos;</code> sign, e.g., <code>-http.status_code</code>.
        </p>
      </div>
    );
  };

  return (
    <div className="TracePageSearchBar">
      {/* style inline because compact overwrites the display */}
      <Input.Group className="ub-justify-end" compact style={{ display: 'flex' }}>
        <UiFindInput
          inputProps={uiFindInputInputProps}
          forwardedRef={forwardedRef}
        />
        <Tooltip
          arrowPointAtCenter
          placement="bottomLeft"
          trigger="hover"
          overlayStyle={{ maxWidth: '600px' }} // This is a large tooltip and the default is too narrow.
          title={renderTooltip()}
        >
          <div className="help-btn-container">
            <IoHelp className="help-button" />
          </div>
        </Tooltip>
        {navigable && (
          <>
            <Button
              className={cx(btnClass, 'TracePageSearchBar--locateBtn')}
              disabled={!textFilter}
              htmlType="button"
              onClick={focusUiFindMatches}
            >
              <IoLocate />
            </Button>
            <Button
              className={cx(btnClass, 'TracePageSearchBar--ButtonUp')}
              disabled={!textFilter}
              htmlType="button"
              data-testid="UpOutlined"
              onClick={prevResult}
            >
              <IoChevronUp />
            </Button>
            <Button
              className={cx(btnClass, 'TracePageSearchBar--ButtonDown')}
              disabled={!textFilter}
              htmlType="button"
              data-testid="DownOutlined"
              onClick={nextResult}
            >
              <IoChevronDown />
            </Button>
          </>
        )}
        <Button
          className={cx(btnClass, 'TracePageSearchBar--ButtonClose')}
          disabled={!textFilter}
          htmlType="button"
          data-testid="CloseOutlined"
          onClick={clearSearch}
        >
          <IoClose />
        </Button>
      </Input.Group>
    </div>
  );
}

export default React.forwardRef((props: TracePageSearchBarProps, ref: React.Ref<InputRef>) => (
  <TracePageSearchBarFn {...props} forwardedRef={ref} />
));
