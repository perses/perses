// Copyright The Perses Authors
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

import { render, screen } from '@testing-library/react';

import { HighlightedMatch } from './HighlightedMatch';

describe('HighlightedMatch', () => {
  const testId = 'highlighted-match';
  const renderComponent = (value: string, intervals: Array<{ from: number; to: number }>): HTMLElement => {
    render(<HighlightedMatch sx={{}} value={value} intervals={intervals} dataTestId={testId} />);
    return screen.getByTestId(testId);
  };

  it('renders the original text when there are no matches', () => {
    const element = renderComponent('Production', []);
    expect(element.textContent).toBe('Production');

    expect(element.querySelectorAll('strong')).toHaveLength(0);
  });

  it('highlights a single match', () => {
    const element = renderComponent('table', [{ from: 1, to: 2 }]);
    expect(element.textContent).toBe('table');
    expect(element.querySelector('strong')?.textContent).toBe('ab');
  });

  it('highlights multiple non-consecutive matches', () => {
    const element = renderComponent('banana', [
      { from: 1, to: 1 },
      { from: 3, to: 3 },
    ]);

    const highlighted = element.querySelectorAll('strong');
    expect(element.textContent).toBe('banana');
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0]?.textContent).toBe('a');
    expect(highlighted[1]?.textContent).toBe('a');
  });

  it('highlights the entire string', () => {
    const element = renderComponent('hello', [{ from: 0, to: 4 }]);
    expect(element.querySelector('strong')?.textContent).toBe('hello');
    expect(element.querySelectorAll('strong')).toHaveLength(1);
  });

  it('renders special chars as text not htm', () => {
    const value = '<script>alert("attack!")</script>';
    const element = renderComponent(value, []);
    expect(element.textContent).toBe(value);
    expect(element.querySelector('script')).toBeNull();
  });
});
