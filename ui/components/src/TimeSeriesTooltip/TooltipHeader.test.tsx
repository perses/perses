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
import { TooltipHeader, TooltipHeaderProps } from './TooltipHeader';
import { PIN_TOOLTIP_HELP_TEXT, UNPIN_TOOLTIP_HELP_TEXT } from './tooltip-model';

describe('TooltipHeader', () => {
  const renderComponent = (props: TooltipHeaderProps) => {
    render(<TooltipHeader {...props} />);
  };

  const testSeriesTimeMs = 1671803580000;
  const testNearbySeries = [
    {
      seriesIdx: 0,
      datumIdx: 14,
      seriesName:
        '{device="/dev/vda1",env="demo",fstype="ext4",instance="demo.do.prometheus.io:9100",job="node",mountpoint="/"}',
      date: testSeriesTimeMs,
      x: testSeriesTimeMs,
      y: 0.29086960933858064,
      formattedY: '29%',
      markerColor: '#56B4E9',
      isClosestToCursor: true,
    },
  ];

  it('should display with correct date and pin text', () => {
    const tooltipContent: TooltipHeaderProps = {
      nearbySeries: testNearbySeries,
      isTooltipPinned: false,
      totalSeries: 5,
      showAllSeries: false,
      enablePinning: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('Dec 23, 2022 -')).toBeInTheDocument();
    expect(screen.getByText('13:53:00')).toBeInTheDocument();
    expect(screen.getByText(PIN_TOOLTIP_HELP_TEXT)).toBeInTheDocument();
  });

  it('should display with unpin text', () => {
    const tooltipContent: TooltipHeaderProps = {
      nearbySeries: testNearbySeries,
      isTooltipPinned: true,
      totalSeries: 5,
      showAllSeries: false,
      enablePinning: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText(UNPIN_TOOLTIP_HELP_TEXT)).toBeInTheDocument();
  });

  it('should not display show all toggle when only 1 total series', () => {
    const tooltipContent: TooltipHeaderProps = {
      nearbySeries: testNearbySeries,
      isTooltipPinned: false,
      totalSeries: 1,
      showAllSeries: false,
      enablePinning: true,
    };
    renderComponent(tooltipContent);
    expect(screen.queryByText('Show All?')).not.toBeInTheDocument();
  });

  it('should not display pin tooltip text and icon', () => {
    const tooltipContent: TooltipHeaderProps = {
      nearbySeries: testNearbySeries,
      isTooltipPinned: false,
      totalSeries: 6,
      showAllSeries: false,
      enablePinning: false,
    };
    renderComponent(tooltipContent);
    expect(screen.queryByText(PIN_TOOLTIP_HELP_TEXT)).not.toBeInTheDocument();
  });
});
