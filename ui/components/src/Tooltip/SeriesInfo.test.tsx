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
import { SeriesInfo, SeriesInfoProps } from './SeriesInfo';

describe('SeriesInfo', () => {
  const renderComponent = (props: SeriesInfoProps) => {
    render(<SeriesInfo {...props} />);
  };

  it('render unformatted series name', () => {
    const seriesInfo: SeriesInfoProps = {
      seriesName: '__name__="node_load1", env="demo", instance="demo.do.prometheus.io:9100", job="node"',
      y: 0.41,
      formattedY: '41.0%',
      markerColor: 'hsla(291443380,50%,50%,0.8)',
      totalSeries: 1,
      wrapLabels: true,
    };
    renderComponent(seriesInfo);
    expect(screen.getByText('value:')).toBeInTheDocument();
    // expect(screen.getByText('test:')).toBeInTheDocument();
  });

  it('render formatted series name', () => {
    const seriesInfo: SeriesInfoProps = {
      seriesName: 'alerting slo',
      y: 100,
      formattedY: '100.00%',
      markerColor: 'hsla(291443380,50%,50%,0.8)',
      totalSeries: 1,
      wrapLabels: true,
    };
    renderComponent(seriesInfo);
    expect(screen.getByText('value:')).toBeInTheDocument();
    // expect(screen.getByText('test:')).toBeInTheDocument();
  });

  it('render single JSON formatted series name', () => {
    const seriesInfo: SeriesInfoProps = {
      seriesName: '{"cluster":"demo","namespace":"demo-01","service":"alerting","window":"1h"}',
      y: 1.111,
      formattedY: '1.11',
      markerColor: 'hsla(-1715826000,50%,50%,0.8)',
      totalSeries: 1,
      wrapLabels: true,
    };
    renderComponent(seriesInfo);
    expect(screen.getByText('value:')).toBeInTheDocument();
  });
});
