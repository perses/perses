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
import { Checkbox } from 'antd';
import { FixedSizeList as VList } from 'react-window';
import { Key as EKey } from 'ts-key-enum';

import FilteredList from './index';

describe('<FilteredList>', () => {
  const words = ['and', 'apples', 'are'];
  const numbers = ['0', '1', '2'];

  let props;
  let wrapper;

  const getData = () => wrapper.find(VList).prop('itemData');

  const keyDown = key => wrapper.find('input').simulate('keydown', { key });

  beforeEach(() => {
    props = {
      cancel: jest.fn(),
      options: words.concat(numbers),
      value: null,
      setValue: jest.fn(),
    };
    wrapper = shallow(<FilteredList {...props} />);
  });

  it('renders without exploding', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper).toMatchSnapshot();
  });

  it('puts the focus on the input on update', () => {
    const fn = jest.fn();
    wrapper.instance().inputRef = {
      current: {
        focus: fn,
      },
    };
    wrapper.setProps({ value: 'anything' });
    expect(fn.mock.calls.length).toBe(1);
  });

  it('filters options based on the current input text', () => {
    expect(getData().options).toEqual(props.options);
    wrapper.find('input').simulate('change', { target: { value: 'a' } });
    expect(getData().options).toEqual(words);
  });

  it('setting the value clears the filter and focus index', () => {
    const n = -99;
    const s = 'a';
    wrapper.setState({ filterText: s, focusedIndex: n });
    let data = getData();
    expect(data.focusedIndex).toBe(n);
    expect(data.options).toEqual(words);

    data.setValue('anything');
    data = getData();
    expect(data.options.length).toBe(props.options.length);
    expect(data.focusedIndex).toBe(null);
  });

  describe('up / down arrow keys', () => {
    let indices;

    beforeAll(() => jest.useFakeTimers('modern'));

    beforeEach(() => {
      indices = {
        visibleStartIndex: 1,
        visibleStopIndex: props.options.length - 1,
      };
      wrapper.instance().onListItemsRendered(indices);
      jest.runAllTimers();
    });

    afterAll(jest.useRealTimers);

    it('down arrow sets the focus index to the first visible item when focusIndex == null', () => {
      keyDown(EKey.ArrowDown);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStartIndex);
    });

    it('up arrow sets the focus index to the last visible item when focusIndex == null', () => {
      keyDown(EKey.ArrowUp);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStopIndex);
    });

    it('shift the focus index to the next element', () => {
      keyDown(EKey.ArrowUp);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStopIndex);
      keyDown(EKey.ArrowUp);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStopIndex - 1);
    });

    it('cause the view to scroll if necessary', () => {
      const fn = jest.fn();
      keyDown(EKey.ArrowDown);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStartIndex);
      wrapper.instance().vlistRef = {
        current: {
          scrollToItem: fn,
        },
      };
      keyDown(EKey.ArrowUp);
      expect(wrapper.state('focusedIndex')).toBe(indices.visibleStartIndex - 1);
      expect(fn.mock.calls).toEqual([[indices.visibleStartIndex - 1]]);
    });
  });

  describe('multi mode checkbox', () => {
    const addValues = jest.fn();
    const removeValues = jest.fn();
    const click = checked => wrapper.find(Checkbox).simulate('change', { target: { checked } });
    const isChecked = () => wrapper.find(Checkbox).prop('checked');
    const isIndeterminate = () => wrapper.find(Checkbox).prop('indeterminate');

    beforeEach(() => {
      wrapper.setProps({ multi: true, addValues, removeValues });
      addValues.mockReset();
      removeValues.mockReset();
    });

    it('is omitted if multi is false or addValues or removeValues is not provided', () => {
      wrapper.setProps({ multi: false });
      expect(wrapper.find(Checkbox).length).toBe(0);

      wrapper.setProps({ multi: true, addValues: undefined });
      expect(wrapper.find(Checkbox).length).toBe(0);

      wrapper.setProps({ addValues, removeValues: undefined });
      expect(wrapper.find(Checkbox).length).toBe(0);
    });

    it('is present in multi mode', () => {
      expect(wrapper.find(Checkbox).length).toBe(1);
    });

    it('is unchecked if nothing is selected', () => {
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(false);
    });

    it('is indeterminate if one is selected', () => {
      wrapper.setProps({ value: words[0] });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(true);
    });

    it('is indeterminate if some are selected', () => {
      wrapper.setProps({ value: new Set(words) });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(true);
    });

    it('is checked if all are selected', () => {
      wrapper.setProps({ value: new Set([...words, ...numbers]) });
      expect(isChecked()).toBe(true);
      expect(isIndeterminate()).toBe(false);
    });

    it('is unchecked if nothing filtered is selected', () => {
      wrapper.setState({ filterText: numbers[0] });
      wrapper.setProps({ value: new Set(words) });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(false);
    });

    it('is unchecked if one filtered value is selected', () => {
      wrapper.setState({ filterText: numbers[0] });
      wrapper.setProps({ value: new Set(words) });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(false);
    });

    it('is indeterminate if one filtered value is selected', () => {
      wrapper.setState({ filterText: words[0][0] });
      wrapper.setProps({ value: words[0] });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(true);
    });

    it('is indeterminate if some filtered values are selected', () => {
      wrapper.setState({ filterText: words[0][0] });
      wrapper.setProps({ value: new Set(words.slice(1)) });
      expect(isChecked()).toBe(false);
      expect(isIndeterminate()).toBe(true);
    });

    it('is checked if all filtered values are selected', () => {
      wrapper.setState({ filterText: words[0][0] });
      wrapper.setProps({ value: new Set(words) });
      expect(isChecked()).toBe(true);
      expect(isIndeterminate()).toBe(false);
    });

    it('unselects all filtered values when clicked and checked', () => {
      wrapper.setState({ filterText: words[0][0] });
      click(false);
      expect(removeValues).toHaveBeenCalledTimes(1);
      expect(removeValues).toHaveBeenCalledWith(words);
      expect(addValues).not.toHaveBeenCalled();
    });

    it('selects all filtered values when clicked and unchecked', () => {
      wrapper.setState({ filterText: words[0][0] });
      click(true);
      expect(addValues).toHaveBeenCalledTimes(1);
      expect(addValues).toHaveBeenCalledWith(words);
      expect(removeValues).not.toHaveBeenCalled();
    });

    it('selects all unselected filtered values when clicked and unchecked', () => {
      wrapper.setState({ filterText: words[0][0] });
      wrapper.setProps({ value: words[0] });
      click(true);
      expect(addValues).toHaveBeenCalledTimes(1);
      expect(addValues).toHaveBeenCalledWith(words.slice(1));
      expect(removeValues).not.toHaveBeenCalled();
    });
  });

  it('escape triggers cancel', () => {
    expect(props.cancel.mock.calls.length).toBe(0);
    keyDown(EKey.Escape);
    expect(props.cancel.mock.calls.length).toBe(1);
  });

  it('enter selects the current focus index', () => {
    const focusedIndex = 0;
    expect(props.setValue.mock.calls.length).toBe(0);
    wrapper.setState({ focusedIndex });
    keyDown(EKey.Enter);
    expect(props.setValue.mock.calls).toEqual([[props.options[focusedIndex]]]);
  });

  it('enter selects the filteredOption if there is only one option', () => {
    const value = words[1];
    wrapper.find('input').simulate('change', { target: { value } });
    expect(props.setValue.mock.calls.length).toBe(0);
    keyDown(EKey.Enter);
    expect(props.setValue.mock.calls).toEqual([[value]]);
  });

  it('enter is ignored when an item is not focused', () => {
    expect(props.setValue.mock.calls.length).toBe(0);
    keyDown(EKey.Enter);
    expect(props.setValue.mock.calls.length).toBe(0);
  });

  it('scrolling unsets the focus index', () => {
    jest.useFakeTimers('modern');
    wrapper.setState({ focusedIndex: 0 });
    wrapper.instance().onListScrolled({ scrollUpdateWasRequested: false });
    jest.runAllTimers();
    expect(wrapper.state('focusedIndex')).toBe(null);
  });
});
