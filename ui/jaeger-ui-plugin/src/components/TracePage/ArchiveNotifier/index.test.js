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
import { mount, shallow } from 'enzyme';
import { notification } from 'antd';
import { IoTimeOutline } from 'react-icons/io5';
import LoadingIndicator from '../../common/LoadingIndicator';
import ArchiveNotifier from './index';
import { Details, Message } from '../../common/ErrorMessage';

jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    notification: {
      destroy: jest.fn(),
      info: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
    },
  };
});

describe('<ArchiveNotifier>', () => {
  let wrapper;
  let defaultProps;

  beforeEach(() => {
    defaultProps = {
      archivedState: { isArchived: true },
      acknowledge: jest.fn(),
    };

    wrapper = mount(<ArchiveNotifier {...defaultProps} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('notification success() is called with default props', () => {
    expect(notification.success).toBeCalledWith(
      expect.objectContaining({
        key: 'ENotifiedState.Outcome',
        description: null,
        duration: null,
        icon: <IoTimeOutline className="ArchiveNotifier--doneIcon" />,
        message: 'This trace has been archived.',
        onClose: defaultProps.acknowledge,
      })
    );
  });

  it('notification close() is called onUnmount', () => {
    wrapper.unmount();
    expect(notification.destroy).toBeCalledWith('ENotifiedState.Outcome');
  });

  it('notification close() is not called onUnmount of null state', () => {
    const props = { ...defaultProps, archivedState: null };
    wrapper = mount(<ArchiveNotifier {...props} />);

    expect(wrapper.state().notifiedState).toEqual(null);
    wrapper.unmount();
    expect(notification.destroy).not.toBeCalled();
  });

  it('notification close() is not called onUnmount of isAcknowledged state', () => {
    const props = { ...defaultProps, archivedState: { isAcknowledged: true } };
    wrapper = mount(<ArchiveNotifier {...props} />);

    wrapper.unmount();
    expect(notification.destroy).not.toBeCalled();
  });

  it('will throw on missing both isArchived and error from archivedState prop', () => {
    const props = { ...defaultProps, archivedState: {} };
    expect(() => {
      shallow(<ArchiveNotifier {...props} />);
    }).toThrow('Unexpected condition');
  });

  /**
   * TODO: Is there a better way to test these next two?
   *
   * state is internal to the component and probably shouldn't be checked externally, but in this
   * case, this is basically a no-op, and the test would be a potentially infinite list of things
   * that didn't occur, which isn't a great test either.
   */
  it('sets internal notifiedState to null on null archivedState prop', () => {
    const props = { ...defaultProps, archivedState: null };
    wrapper = mount(<ArchiveNotifier {...props} />);

    expect(wrapper.state().notifiedState).toEqual(null);
  });

  it('sets internal notifiedState to null on archivedState.isAcknowledged', () => {
    const props = { ...defaultProps, archivedState: { isAcknowledged: true } };
    wrapper = mount(<ArchiveNotifier {...props} />);

    expect(wrapper.state().notifiedState).toEqual(null);
  });

  it('will call notification.info on isLoading is true', () => {
    const props = { ...defaultProps, archivedState: { isLoading: true } };
    wrapper = mount(<ArchiveNotifier {...props} />);

    expect(notification.info).toBeCalledWith(
      expect.objectContaining({
        key: 'ENotifiedState.Progress',
        description: null,
        duration: 0,
        icon: <LoadingIndicator />,
        message: 'Archiving trace...',
      })
    );
  });

  it('will call notification.warn on error state', () => {
    const props = { ...defaultProps, archivedState: { error: 'This is an error string' } };
    wrapper = mount(<ArchiveNotifier {...props} />);

    expect(notification.warning).toBeCalledWith(
      expect.objectContaining({
        key: 'ENotifiedState.Outcome',
        className: 'ArchiveNotifier--errorNotification',
        description: <Details error="This is an error string" wrap />,
        duration: null,
        icon: <IoTimeOutline className="ArchiveNotifier--errorIcon" />,
        message: <Message error="This is an error string" wrap />,
        onClose: props.acknowledge,
      })
    );
  });

  it('will call notification.close new state type', () => {
    const props = { ...defaultProps, archivedState: { isLoading: true } };
    wrapper = mount(<ArchiveNotifier {...props} />);

    const newProps = { ...props, archivedState: { isArchived: true } };
    wrapper.setProps(newProps);

    expect(notification.destroy).toBeCalledWith('ENotifiedState.Progress');
  });

  it('will call notification.close on null state update', () => {
    const newProps = { ...defaultProps, archivedState: null };
    wrapper.setProps(newProps);

    expect(notification.destroy).toBeCalledWith('ENotifiedState.Outcome');
  });
});
