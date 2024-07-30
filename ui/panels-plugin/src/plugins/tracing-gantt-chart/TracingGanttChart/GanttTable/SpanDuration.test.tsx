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
import { trace1_root, trace1_root_child1_child1 } from '../../../../test';
import { GanttTableProvider } from './GanttTableProvider';
import { SpanDuration, SpanDurationProps } from './SpanDuration';

describe('SpanDuration', () => {
  const renderComponent = (props: SpanDurationProps) => {
    return render(
      <GanttTableProvider>
        <SpanDuration {...props} />
      </GanttTableProvider>
    );
  };

  it('render span bar', () => {
    renderComponent({
      span: trace1_root_child1_child1,
      viewport: { startTimeUnixMs: trace1_root.startTimeUnixMs, endTimeUnixMs: trace1_root.endTimeUnixMs },
    });
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });
});
