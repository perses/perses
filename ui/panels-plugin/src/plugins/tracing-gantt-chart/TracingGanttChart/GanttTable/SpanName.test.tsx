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
import { trace1_root_child1, trace1_root_child1_child1 } from '../../../../test';
import { SpanName, SpanNameProps } from './SpanName';
import { GanttTableProvider } from './GanttTableProvider';

describe('SpanName', () => {
  const renderComponent = (props: Omit<SpanNameProps, 'nameColumnWidth'>) => {
    return render(
      <GanttTableProvider>
        <SpanName {...props} nameColumnWidth={25} />
      </GanttTableProvider>
    );
  };

  it('render span name without error', () => {
    renderComponent({ span: trace1_root_child1_child1 });
    expect(screen.getByText('testChildSpan3')).toBeInTheDocument();
    expect(screen.queryByText('error')).not.toBeInTheDocument();
  });

  it('render span name with error', () => {
    renderComponent({ span: trace1_root_child1 });
    expect(screen.getByText('testChildSpan2')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
