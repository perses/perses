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
import { screen } from '@testing-library/dom';
import { SeriesInfo, SeriesInfoProps } from './SeriesInfo';

describe('SeriesInfo', () => {
  const renderComponent = (props: SeriesInfoProps) => {
    render(<SeriesInfo {...props} />);
  };

  it('render metric __name__ beside formattedY value', () => {
    const seriesInfo: SeriesInfoProps = {
      seriesName: 'node_load1{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
      y: 0.28,
      formattedY: '28.0%',
      markerColor: 'hsla(1016196180,50%,50%,0.8)',
      totalSeries: 1,
      wrapLabels: true,
    };
    renderComponent(seriesInfo);
    expect(screen.getByText('node_load1:')).toBeInTheDocument();
    expect(screen.getByText('28.0%')).toBeInTheDocument();
    expect(screen.getByText('instance="demo.do.prometheus.io:')).toBeInTheDocument();
  });

  it('render preformatted series name beside formattedY value', () => {
    const seriesInfo: SeriesInfoProps = {
      seriesName: 'Node memory total',
      y: 552341504,
      formattedY: '526.75 MB',
      markerColor: 'hsla(-1756459732,50%,50%,0.8)',
      totalSeries: 2,
      wrapLabels: true,
    };
    renderComponent(seriesInfo);
    expect(screen.getByText('Node memory total')).toBeInTheDocument();
    expect(screen.getByText('526.75 MB')).toBeInTheDocument();
  });
});
