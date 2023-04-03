// Copyright 2023 The Perses Authors
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
import { TooltipContent, TooltipContentProps } from './TooltipContent';

describe('TooltipContent', () => {
  const renderComponent = (props: TooltipContentProps) => {
    render(<TooltipContent {...props} />);
  };

  it('should display a single series name', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          seriesIdx: 0,
          datumIdx: 84,
          seriesName: 'Test node demo.do.prometheus.io:9100',
          date: 'Dec 23, 2022, 1:53:00 PM',
          x: 1671821580000,
          y: 0.1,
          formattedY: '0.1',
          markerColor: 'hsla(19838016,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('Test node demo.do.prometheus.io:9100')).toBeInTheDocument();
    expect(screen.getByText('Dec 23, 2022 -')).toBeInTheDocument();
    expect(screen.getByText('13:53:00')).toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
  });

  it('should display multiple series data', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          seriesIdx: 2,
          datumIdx: 48,
          seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 'Dec 23, 2022, 1:44:00 PM',
          x: 1671821040000,
          y: 84635648,
          formattedY: '84.64M',
          markerColor: 'hsla(1887856572,50%,50%,0.8)',
        },
        {
          seriesIdx: 1,
          datumIdx: 48,
          seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 'Dec 23, 2022, 1:44:00 PM',
          x: 1671821040000,
          y: 33771520,
          formattedY: '33.77M',
          markerColor: 'hsla(158479636,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
      showQuery: false,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('84.64M')).toBeInTheDocument();
    expect(screen.getByText('33.77M')).toBeInTheDocument();
    expect(screen.getAllByText('env="demo", instance="demo.do.prometheus.io:9100", job="node"')).toHaveLength(2);
  });

  it('should display query before wrapped labels', () => {
    const tooltipContent: TooltipContentProps = {
      focusedSeries: [
        {
          seriesIdx: 2,
          datumIdx: 48,
          seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 'Dec 23, 2022, 1:44:00 PM',
          x: 1671821040000,
          y: 84635648,
          formattedY: '84.64M',
          markerColor: 'hsla(1887856572,50%,50%,0.8)',
        },
        {
          seriesIdx: 1,
          datumIdx: 48,
          seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 'Dec 23, 2022, 1:44:00 PM',
          x: 1671821040000,
          y: 33771520,
          formattedY: '33.77M',
          markerColor: 'hsla(158479636,50%,50%,0.8)',
        },
      ],
      wrapLabels: true,
      showQuery: true,
    };
    renderComponent(tooltipContent);
    expect(
      screen.getByText('node_memory_MemFree_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}')
    ).toBeInTheDocument();
    expect(
      screen.getByText('node_memory_Buffers_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}')
    ).toBeInTheDocument();
  });
});
