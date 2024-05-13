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
import { shallow } from 'enzyme';
import { Dropdown } from 'antd';
import AltViewOptions from './AltViewOptions';
import * as track from './TracePageHeader.track';
import { ETraceViewType } from '../types';

describe('AltViewOptions', () => {
  let trackGanttView;
  let trackGraphView;
  let trackJsonView;
  let trackRawJsonView;
  let trackStatisticsView;
  let trackTraceSpansView;

  let wrapper;
  const getLink = text => {
    const links = wrapper.find(Dropdown).prop('menu').items;
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link.label.props.children === text) return link.label.props;
    }
    throw new Error(`Could not find "${text}"`);
  };

  const props = {
    viewType: ETraceViewType.TraceTimelineViewer,
    traceID: 'test trace ID',
    onTraceViewChange: jest.fn(),
  };

  beforeAll(() => {
    trackGanttView = jest.spyOn(track, 'trackGanttView');
    trackGraphView = jest.spyOn(track, 'trackGraphView');
    trackJsonView = jest.spyOn(track, 'trackJsonView');
    trackRawJsonView = jest.spyOn(track, 'trackRawJsonView');
    trackStatisticsView = jest.spyOn(track, 'trackStatisticsView');
    trackTraceSpansView = jest.spyOn(track, 'trackTraceSpansView');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = shallow(<AltViewOptions {...props} />);
  });

  it('renders correctly', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('disables json links because disableJsonView is true', () => {
    wrapper.setProps({ disableJsonView: true });

    expect(() => getLink('Trace JSON')).toThrow('Could not find "Trace JSON"');
    expect(() => getLink('Trace JSON (unadjusted)')).toThrow('Could not find "Trace JSON (unadjusted)"');
  });

  it('tracks viewing JSONs', () => {
    expect(trackJsonView).not.toHaveBeenCalled();
    getLink('Trace JSON').onClick();
    expect(trackJsonView).toHaveBeenCalledTimes(1);

    expect(trackRawJsonView).not.toHaveBeenCalled();
    getLink('Trace JSON (unadjusted)').onClick();
    expect(trackRawJsonView).toHaveBeenCalledTimes(1);

    expect(trackJsonView).toHaveBeenCalledTimes(1);
    expect(trackGanttView).not.toHaveBeenCalled();
    expect(trackGraphView).not.toHaveBeenCalled();
    expect(trackTraceSpansView).not.toHaveBeenCalled();
  });

  it('track dropdown menu', () => {
    const viewInteractions = [
      {
        link: 'Trace Graph',
        trackFn: trackGraphView,
        onTraceViewChangeArg: ETraceViewType.TraceGraph,
      },
      {
        link: 'Trace Statistics',
        trackFn: trackStatisticsView,
        onTraceViewChangeArg: ETraceViewType.TraceStatisticsView,
        propViewType: ETraceViewType.TraceGraph,
      },
      {
        link: 'Trace Timeline',
        trackFn: trackGanttView,
        onTraceViewChangeArg: ETraceViewType.TraceTimelineViewer,
        propViewType: ETraceViewType.TraceStatisticsView,
      },
      {
        link: 'Trace Spans Table',
        trackFn: trackTraceSpansView,
        onTraceViewChangeArg: ETraceViewType.TraceSpansView,
        propViewType: ETraceViewType.TraceTimelineViewer,
      },
    ];

    viewInteractions.forEach(({ link, trackFn, propViewType }, i) => {
      if (propViewType) {
        wrapper.setProps({
          viewType: propViewType,
        });
      }
      expect(props.onTraceViewChange).toHaveBeenCalledTimes(i);
      expect(trackFn).not.toHaveBeenCalled();

      getLink(link).onClick();
      expect(props.onTraceViewChange).toHaveBeenCalledTimes(i + 1);
      viewInteractions.forEach(({ trackFn: fn }, j) => {
        expect(fn).toHaveBeenCalledTimes(j <= i ? 1 : 0);
      });
    });
  });
});
