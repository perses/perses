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

describe('TooltipHeader', () => {
  const renderComponent = (props: TooltipHeaderProps) => {
    render(<TooltipHeader {...props} />);
  };

  const testSeriesTimeMs = 1671803580000;

  it('should display with correct date and pin text', () => {
    const tooltipContent: TooltipHeaderProps = {
      seriesTimeMs: testSeriesTimeMs,
      isTooltipPinned: false,
      totalSeries: 5,
      showAllSeries: false,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('Dec 23, 2022 -')).toBeInTheDocument();
    expect(screen.getByText('13:53:00')).toBeInTheDocument();
    expect(screen.getByText('Click to Pin')).toBeInTheDocument();
    expect(screen.getByText('Show All?')).toBeInTheDocument();
  });

  it('should display with unpin text', () => {
    const tooltipContent: TooltipHeaderProps = {
      seriesTimeMs: testSeriesTimeMs,
      isTooltipPinned: true,
      totalSeries: 5,
      showAllSeries: false,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('Click to Unpin')).toBeInTheDocument();
  });

  it('should not display show all toggle when only 1 total series', () => {
    const tooltipContent: TooltipHeaderProps = {
      seriesTimeMs: testSeriesTimeMs,
      isTooltipPinned: false,
      totalSeries: 1,
      showAllSeries: false,
    };
    renderComponent(tooltipContent);
    expect(screen.queryByText('Show All?')).not.toBeInTheDocument();
  });
});
