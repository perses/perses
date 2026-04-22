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

import { isLegendItemVisuallySelected } from './legend-model';

describe('isLegendItemVisuallySelected', () => {
  it('does not highlight the item when "ALL" selected', () => {
    expect(
      isLegendItemVisuallySelected(
        {
          id: 'one',
          label: 'One',
          color: 'red',
        },
        'ALL'
      )
    ).toBeFalsy();
  });

  it('does not highlight the item when it is not in the selected object', () => {
    expect(
      isLegendItemVisuallySelected(
        {
          id: 'one',
          label: 'One',
          color: 'red',
        },
        {
          two: true,
        }
      )
    ).toBeFalsy();
  });

  it('does not highlight the item when it is false in the selected object', () => {
    expect(
      isLegendItemVisuallySelected(
        {
          id: 'one',
          label: 'One',
          color: 'red',
        },
        {
          one: false,
          two: true,
        }
      )
    ).toBeFalsy();
  });

  it('highlights the item when it is true in the selected object', () => {
    expect(
      isLegendItemVisuallySelected(
        {
          id: 'one',
          label: 'One',
          color: 'red',
        },
        {
          one: true,
          two: true,
        }
      )
    ).toBeTruthy();
  });
});
