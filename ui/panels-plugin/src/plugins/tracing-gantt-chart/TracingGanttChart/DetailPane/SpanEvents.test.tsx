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
import { MOCK_GANTT_TRACE } from '../../../../test';
import { SpanEventList, SpanEventListProps } from './SpanEvents';

describe('SpanEvents', () => {
  const renderComponent = (props: SpanEventListProps) => {
    return render(<SpanEventList {...props} />);
  };

  it('render', () => {
    renderComponent({ trace: MOCK_GANTT_TRACE, span: MOCK_GANTT_TRACE.rootSpan.childSpans[0]! });

    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('event1_name')).toBeInTheDocument();
    expect(screen.getByText('event1_key')).toBeInTheDocument();
    expect(screen.getByText('event1_value')).toBeInTheDocument();
  });
});
