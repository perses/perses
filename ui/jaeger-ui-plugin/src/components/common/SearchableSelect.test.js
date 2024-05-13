// Copyright (c) 2023 The Jaeger Authors
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
import { shallow } from 'enzyme';

import { Select } from 'antd';
import SearchableSelect, { filterOptionsByLabel } from './SearchableSelect';

describe('SearchableSelect', () => {
  let wrapper;

  const options = [
    { label: 'Test 1', value: 'test1' },
    { label: 'Test 2', value: 'test2' },
    { label: 'Test 3', value: 'test3' },
  ];

  beforeEach(() => {
    wrapper = shallow(
      <SearchableSelect>
        {options.map((option, i) => (
          <Select.Option key={option.value} value={option.value} data-testid={`option-${i}`}>
            {option.label}
          </Select.Option>
        ))}
      </SearchableSelect>
    );
  });

  it('SearchableSelect renders with all props and options', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('search is enabled', () => {
    expect(wrapper.props().showSearch).toBe(true);
  });

  it('renders all the options correctly', () => {
    const ops = wrapper.find(Select.Option);

    expect(ops.length).toBe(3);

    ops.forEach((op, i) => {
      expect(op.props().value).toBe(options[i].value);
      expect(op.props().children).toBe(options[i].label);
    });
  });
});

describe('filterOptionsByLabel', () => {
  const options = [
    {
      children: 'Test 1',
      label: 'Test 1',
      value: 'test1',
    },
  ];

  it('should return true when passed empty input', () => {
    const input = filterOptionsByLabel('', options[0]);

    expect(input).toBe(true);
  });

  it('should return true when passed matching lowercase string', () => {
    const input = filterOptionsByLabel('test', options[0]);

    expect(input).toBe(true);
  });

  it('should return true when passed matching uppercase string', () => {
    const input = filterOptionsByLabel('TEST', options[0]);

    expect(input).toBe(true);
  });

  it('should return false when passed non-matching', () => {
    const input = filterOptionsByLabel('jaeger', options[0]);

    expect(input).toBe(false);
  });

  it('should return false when passed null option', () => {
    const input = filterOptionsByLabel('jaeger', null);

    expect(input).toBe(false);
  });
});
