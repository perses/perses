// Copyright (c) 2019 Uber Technologies, Inc.
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
import { Input, InputRef } from 'antd';
import { IoClose } from 'react-icons/io5';
import { History as RouterHistory, Location } from 'history';
import _debounce from 'lodash/debounce';
import _isString from 'lodash/isString';
import { connect } from 'react-redux';

import updateUiFind from '../../utils/update-ui-find';
import { TNil, ReduxState } from '../../types/index';
import parseQuery from '../../utils/parseQuery';
import withRouteProps from '../../utils/withRouteProps';

type TOwnProps = {
  allowClear?: boolean;
  forwardedRef?: React.Ref<InputRef>;
  inputProps: Record<string, any>;
  history: RouterHistory;
  location: Location;
  match: any;
  trackFindFunction?: (str: string | TNil) => void;
};

export type TExtractUiFindFromStateReturn = {
  uiFind: string | undefined;
};

type TProps = TOwnProps & TExtractUiFindFromStateReturn;

type StateType = {
  ownInputValue: string | undefined;
};

export class UnconnectedUiFindInput extends React.PureComponent<TProps, StateType> {
  static defaultProps: Partial<TProps> = {
    forwardedRef: undefined,
    inputProps: {},
    trackFindFunction: undefined,
    uiFind: undefined,
  };

  state = {
    ownInputValue: undefined,
  };

  updateUiFindQueryParam = _debounce((uiFind?: string) => {
    const { history, location, uiFind: prevUiFind, trackFindFunction } = this.props;
    if (uiFind === prevUiFind || (!prevUiFind && !uiFind)) return;
    updateUiFind({
      location,
      history,
      trackFindFunction,
      uiFind,
    });
  }, 250);

  clearUiFind = () => {
    this.updateUiFindQueryParam();
    this.updateUiFindQueryParam.flush();
  };

  handleInputBlur = () => {
    this.updateUiFindQueryParam.flush();
    this.setState({ ownInputValue: undefined });
  };

  handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target;
    this.updateUiFindQueryParam(value);
    this.setState({ ownInputValue: value });
  };

  render() {
    const { allowClear, forwardedRef, inputProps } = this.props;

    const inputValue = _isString(this.state.ownInputValue) ? this.state.ownInputValue : this.props.uiFind;
    const suffix = (
      <>
        {allowClear && inputValue && inputValue.length && <IoClose onClick={this.clearUiFind} />}
        {inputProps.suffix}
      </>
    );

    return (
      <Input
        placeholder="Find..."
        {...inputProps}
        onBlur={this.handleInputBlur}
        onChange={this.handleInputChange}
        ref={forwardedRef}
        suffix={suffix}
        value={inputValue}
      />
    );
  }
}

export function extractUiFindFromState(state: ReduxState): TExtractUiFindFromStateReturn {
  const { uiFind: uiFindFromUrl } = parseQuery(state.router.location.search);
  const uiFind = Array.isArray(uiFindFromUrl) ? uiFindFromUrl.join(' ') : uiFindFromUrl;
  return { uiFind };
}

export default connect(extractUiFindFromState)(withRouteProps(UnconnectedUiFindInput)) as any;
