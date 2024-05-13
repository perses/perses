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

import React from 'react';
import { mount } from 'enzyme';

import VerticalResizer from './VerticalResizer';

describe('<VerticalResizer>', () => {
  let wrapper;
  let instance;

  const props = {
    min: 0.1,
    max: 0.9,
    onChange: jest.fn(),
    position: 0.5,
  };

  beforeEach(() => {
    props.onChange.mockReset();
    wrapper = mount(<VerticalResizer {...props} />);
    instance = wrapper.instance();
  });

  it('renders without exploding', () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.find('.VerticalResizer').length).toBe(1);
    expect(wrapper.find('.VerticalResizer--gripIcon').length).toBe(1);
    expect(wrapper.find('.VerticalResizer--dragger').length).toBe(1);
  });

  it('sets the root elm', () => {
    const rootWrapper = wrapper.find('.VerticalResizer');
    expect(rootWrapper.getDOMNode()).toBe(instance._rootElm);
  });

  describe('uses DraggableManager', () => {
    it('handles mouse down on the dragger', () => {
      const dragger = wrapper.find({ onMouseDown: instance._dragManager.handleMouseDown });
      expect(dragger.length).toBe(1);
      expect(dragger.is('.VerticalResizer--dragger')).toBe(true);
    });

    it('returns the draggable bounds via _getDraggingBounds()', () => {
      const left = 10;
      const width = 100;
      instance._rootElm.getBoundingClientRect = () => ({ left, width });
      expect(instance._getDraggingBounds()).toEqual({
        width,
        clientXLeft: left,
        maxValue: props.max,
        minValue: props.min,
      });
    });

    it('returns the flipped draggable bounds via _getDraggingBounds()', () => {
      const left = 10;
      const width = 100;
      wrapper.setProps({ rightSide: true });
      instance._rootElm.getBoundingClientRect = () => ({ left, width });
      expect(instance._getDraggingBounds()).toEqual({
        width,
        clientXLeft: left,
        maxValue: 1 - props.min,
        minValue: 1 - props.max,
      });
    });

    it('throws if dragged before rendered', () => {
      wrapper.instance()._rootElm = null;
      expect(instance._getDraggingBounds).toThrow('invalid state');
    });

    it('handles drag start', () => {
      const value = Math.random();
      expect(wrapper.state('dragPosition')).toBe(null);
      instance._handleDragUpdate({ value });
      expect(wrapper.state('dragPosition')).toBe(value);
    });

    it('handles drag update', () => {
      const value = props.position * 1.1;
      expect(wrapper.state('dragPosition')).toBe(null);
      wrapper.instance()._handleDragUpdate({ value });
      expect(wrapper.state('dragPosition')).toBe(value);
    });

    it('handles flipped drag update', () => {
      const value = props.position * 1.1;
      wrapper.setProps({ rightSide: true });
      expect(wrapper.state('dragPosition')).toBe(null);
      wrapper.instance()._handleDragUpdate({ value });
      expect(wrapper.state('dragPosition')).toBe(1 - value);
    });

    it('handles drag end', () => {
      const manager = { resetBounds: jest.fn() };
      const value = Math.random();
      wrapper.setState({ dragPosition: 2 * value });
      instance._handleDragEnd({ manager, value });
      expect(manager.resetBounds.mock.calls).toEqual([[]]);
      expect(wrapper.state('dragPosition')).toBe(null);
      expect(props.onChange.mock.calls).toEqual([[value]]);
    });

    it('handles flipped drag end', () => {
      const manager = { resetBounds: jest.fn() };
      const value = Math.random();
      wrapper.setProps({ rightSide: true });
      wrapper.setState({ dragPosition: 2 * value });
      instance._handleDragEnd({ manager, value });
      expect(manager.resetBounds.mock.calls).toEqual([[]]);
      expect(wrapper.state('dragPosition')).toBe(null);
      expect(props.onChange.mock.calls).toEqual([[1 - value]]);
    });

    it('cleans up DraggableManager on unmount', () => {
      const disposeSpy = jest.spyOn(wrapper.instance()._dragManager, 'dispose');
      wrapper.unmount();
      expect(disposeSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('does not render a dragging indicator when not dragging', () => {
    expect(wrapper.find('.isDraggingLeft').length + wrapper.find('.isDraggingRight').length).toBe(0);
    expect(wrapper.find('.VerticalResizer--dragger').prop('style').right).toBe(undefined);
  });

  it('renders a dragging indicator when dragging', () => {
    instance._dragManager.isDragging = () => true;
    instance._handleDragUpdate({ value: props.min });
    instance.forceUpdate();
    wrapper.update();
    expect(wrapper.find('.isDraggingLeft').length + wrapper.find('.isDraggingRight').length).toBe(1);
    expect(wrapper.find('.VerticalResizer--dragger').prop('style').right).toBeDefined();
  });

  it('renders is-flipped classname when positioned on rightSide', () => {
    expect(wrapper.find('.is-flipped').length).toBe(0);
    wrapper.setProps({ rightSide: true });
    expect(wrapper.find('.is-flipped').length).toBe(1);
  });
});
