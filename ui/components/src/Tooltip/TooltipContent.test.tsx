// Copyright 2022 The Perses Authors
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

import { render } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/dom';
import { TooltipContent, TooltipContentProps } from './TooltipContent';

describe('TooltipContent', () => {
  const renderComponent = (props: TooltipContentProps) => {
    render(<TooltipContent {...props} />);
  };

  it('render tooltip content with a single series name', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          seriesIdx: 0,
          datumIdx: 73,
          seriesName: '__name__="node_load1", env="demo", instance="demo.do.prometheus.io:9100", job="node"',
          date: 'Dec 22, 2022, 10:38:00 AM',
          x: 1671723480000,
          y: 0.13,
          formattedY: '13.0%',
          markerColor: 'hsla(291443380,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('instance:')).toBeInTheDocument();
  });

  it('render tooltip content with a single JSON formatted series name', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          // seriesType: 'line',
          seriesIdx: 0,
          datumIdx: 0,
          seriesName: '{"cluster":"rc","namespace":"uat-test","service":"alerting","slo":"correctness","window":"1h"}',
          date: 'Dec 22, 2022, 8:54:00 AM',
          x: 1671717240000,
          y: 1,
          formattedY: '1.00',
          markerColor: 'hsla(2083592972,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('correctness')).toBeInTheDocument();
  });

  it('render tooltip content with multiple series', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          // seriesType: 'line',
          seriesIdx: 0,
          datumIdx: 0,
          seriesName: '{"cluster":"rc","namespace":"uat-test","service":"alerting","slo":"correctness","window":"1h"}',
          date: 'Dec 22, 2022, 8:54:00 AM',
          x: 1671717240000,
          y: 1,
          formattedY: '1.00',
          markerColor: 'hsla(2083592972,50%,50%,0.8)',
        },
        {
          // seriesType: 'line',
          seriesIdx: 1,
          datumIdx: 0,
          seriesName: '{"cluster":"rc","namespace":"rc-9999","service":"alerting","slo":"correctness","window":"1h"}',
          date: 'Dec 22, 2022, 8:54:00 AM',
          x: 1671717240000,
          y: 1,
          formattedY: '1.00',
          markerColor: 'hsla(-2012293108,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(
      screen.getByText('cluster: rc, namespace: rc-9999, service: alerting, slo: correctness, window: 1h')
    ).toBeInTheDocument();
  });
});
