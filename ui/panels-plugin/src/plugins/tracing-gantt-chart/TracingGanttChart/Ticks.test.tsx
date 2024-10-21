// Copyright 2024 The Perses Authors
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
import { MOCK_TRACE } from '../../../test';
import { TicksHeader, TicksHeaderProps } from './Ticks';

describe('Ticks', () => {
  const renderComponent = (props: TicksHeaderProps) => {
    return render(<TicksHeader {...props} />);
  };

  it('render <TicksHeader>', () => {
    renderComponent({
      rootSpan: MOCK_TRACE.rootSpan,
      viewport: {
        startTimeUnixMs: MOCK_TRACE.rootSpan.startTimeUnixMs,
        endTimeUnixMs: MOCK_TRACE.rootSpan.endTimeUnixMs,
      },
    });
    expect(screen.getByText('0μs')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
    expect(screen.getByText('500ms')).toBeInTheDocument();
    expect(screen.getByText('750ms')).toBeInTheDocument();
    expect(screen.getByText('1s')).toBeInTheDocument();
  });
});
