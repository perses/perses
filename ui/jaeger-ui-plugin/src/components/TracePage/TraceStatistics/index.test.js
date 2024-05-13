// Copyright (c) 2020 The Jaeger Authors.
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

import React from 'react';
import { mount } from 'enzyme';
import TraceStatistics from './index';
import TraceStatisticsHeader from './TraceStatisticsHeader';
import PopupSql from './PopupSql';
import transformTraceData from '../../../model/transform-trace-data';
import { getColumnValues, getColumnValuesSecondDropdown } from './tableValues';

import testTrace from './tableValuesTestTrace/testTrace.json';

const transformedTrace = transformTraceData(testTrace);

describe('<TraceTagOverview>', () => {
  let wrapper;
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      trace: transformedTrace,
      uiFind: undefined,
      uiFindVertexKeys: undefined,
    };

    wrapper = mount(<TraceStatistics {...defaultProps} />);
  });

  it('does not explode', () => {
    expect(wrapper).toBeDefined();
  });

  it('renders Trace Tag Overview', () => {
    expect(wrapper.find(TraceStatisticsHeader).length).toBe(1);
    expect(wrapper.state('valueNameSelector1')).toBe('Service Name');
    expect(wrapper.state('valueNameSelector2')).toBe(null);
    expect(wrapper.find(PopupSql).length).toBe(0);
  });

  it('check search', () => {
    const searchSet = new Set();
    searchSet.add('service1	op1	__LEAF__');

    wrapper.setProps({ uiFind: 'service1', uiFindVertexKeys: searchSet });
    expect(wrapper.state('tableValue')[0].searchColor).toBe('rgb(255,243,215)');

    wrapper.setProps({ uiFind: undefined, uiFindVertexKeys: undefined });
    expect(wrapper.state('tableValue')[0].searchColor).toBe('transparent');
  });

  it('check handler', () => {
    let tableValue = getColumnValues('Service Name', transformedTrace);
    tableValue = getColumnValuesSecondDropdown(
      tableValue,
      'Service Name',
      'Operation Name',
      transformedTrace
    );
    const instance = wrapper.instance();
    instance.handler(tableValue, tableValue, 'Service Name', 'Operation Name');

    // table is sorted only after calling handler
    expect(wrapper.state('tableValue')[2].count).toBe(2);
    expect(wrapper.state('tableValue')[2].parentElement).toBe('service1');
    expect(tableValue[6].count).toBe(2);
    expect(tableValue[6].parentElement).toBe('service1');
  });

  it('check togglePopup', () => {
    const instance = wrapper.instance();
    instance.togglePopup('select *');

    expect(instance.state.popupContent).toBe('select *');
    expect(instance.state.showPopup).toBe(true);

    instance.togglePopup('select *');
    expect(instance.state.popupContent).toBe('select *');
    expect(instance.state.showPopup).toBe(false);
  });
});
