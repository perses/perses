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

import React from 'react';
import { shallow } from 'enzyme';

import ListItem from './ListItem';

describe('<ListItem>', () => {
  let wrapper;
  const props = {
    style: {},
    index: 0,
    data: {
      setValue: jest.fn(),
      focusedIndex: null,
      highlightQuery: '',
      options: ['a', 'b'],
      selectedValue: null,
    },
  };
  const selectedValue = props.data.options[props.index];

  beforeEach(() => {
    props.data.setValue.mockReset();
    wrapper = shallow(<ListItem {...props} />);
  });

  it('renders without exploding', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('is focused when the index is the focusIndex', () => {
    const data = { ...props.data, focusedIndex: props.index };
    wrapper.setProps({ data });
    expect(wrapper).toMatchSnapshot();
  });

  it('is selected when options[index] == selectedValue', () => {
    const data = { ...props.data, selectedValue };
    wrapper.setProps({ data });
    expect(wrapper).toMatchSnapshot();
  });

  it('sets the value when clicked', () => {
    expect(props.data.setValue.mock.calls.length).toBe(0);
    wrapper.simulate('click');
    expect(props.data.setValue.mock.calls).toEqual([[selectedValue]]);
  });

  describe('multi mode', () => {
    const addValues = jest.fn();
    const removeValues = jest.fn();
    const data = { ...props.data, multi: true };

    beforeEach(() => {
      wrapper.setProps({ data });
      addValues.mockReset();
      removeValues.mockReset();
    });

    it('renders without exploding', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('renders as selected when selected', () => {
      wrapper.setProps({ data: { ...data, selectedValue } });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders as selected when selected with others', () => {
      wrapper.setProps({ data: { ...data, selectedValue: new Set(props.data.options) } });
      expect(wrapper).toMatchSnapshot();
    });

    it('no-ops on click when multi add/remove functions are not both available', () => {
      expect(() => wrapper.simulate('click')).not.toThrow();

      wrapper.setProps({ data: { ...data, addValues } });
      expect(() => wrapper.simulate('click')).not.toThrow();
      expect(addValues).not.toHaveBeenCalled();
      expect(removeValues).not.toHaveBeenCalled();

      wrapper.setProps({ data: { ...data, removeValues } });
      expect(() => wrapper.simulate('click')).not.toThrow();
      expect(addValues).not.toHaveBeenCalled();
      expect(removeValues).not.toHaveBeenCalled();
    });

    it('selects value when multi add/remove functions are both available', () => {
      wrapper.setProps({ data: { ...data, addValues, removeValues } });
      wrapper.simulate('click');
      expect(addValues).toHaveBeenCalledTimes(1);
      expect(addValues).toHaveBeenCalledWith([props.data.options[props.index]]);
      expect(removeValues).not.toHaveBeenCalled();
    });

    it('removes value when multi add/remove functions are both available and value is selected', () => {
      wrapper.setProps({ data: { ...data, addValues, removeValues, selectedValue } });
      wrapper.simulate('click');
      expect(removeValues).toHaveBeenCalledTimes(1);
      expect(removeValues).toHaveBeenCalledWith([props.data.options[props.index]]);
      expect(addValues).not.toHaveBeenCalled();
    });
  });
});
