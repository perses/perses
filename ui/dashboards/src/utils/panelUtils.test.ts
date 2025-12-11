// Copyright 2025 The Perses Authors
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

import { PanelGroupItemLayout } from '@perses-dev/core';
import { insertPanelInLayout, UnpositionedPanelGroupItemLayout } from './panelUtils';

describe('insertPanelInLayout', () => {
  describe('inserts the panel to the right when space is available', () => {
    test('with a single panel in that row', () => {
      const newLayout: UnpositionedPanelGroupItemLayout = { i: 'abc', w: 10, h: 8 };
      const referenceLayout: PanelGroupItemLayout = {
        i: 'one',
        x: 0,
        y: 0,
        w: 6,
        h: 6,
      };
      const layouts: PanelGroupItemLayout[] = [referenceLayout];
      expect(insertPanelInLayout(newLayout, referenceLayout, layouts)).toEqual([
        referenceLayout,
        {
          x: 6,
          y: 0,
          ...newLayout,
        },
      ]);
    });

    test('with multiple panels in that row with space between them', () => {
      const newLayout: UnpositionedPanelGroupItemLayout = { i: 'abc', w: 10, h: 8 };
      const referenceLayout: PanelGroupItemLayout = {
        i: 'one',
        x: 0,
        y: 0,
        w: 3,
        h: 4,
      };
      const otherPanelInRow: PanelGroupItemLayout = {
        i: 'two',
        x: 20,
        y: 0,
        w: 4,
        h: 4,
      };
      const layouts: PanelGroupItemLayout[] = [referenceLayout, otherPanelInRow];

      expect(insertPanelInLayout(newLayout, referenceLayout, layouts)).toEqual([
        referenceLayout,
        {
          x: 3,
          y: 0,
          ...newLayout,
        },
        otherPanelInRow,
      ]);
    });
  });

  describe('inserts the panel below when space is not available to the right', () => {
    test('with a single panel in the initial layout', () => {
      const newLayout: UnpositionedPanelGroupItemLayout = { i: 'abc', w: 10, h: 8 };
      const referenceLayout: PanelGroupItemLayout = {
        i: 'one',
        x: 1,
        y: 0,
        w: 18,
        h: 4,
      };
      const layouts: PanelGroupItemLayout[] = [referenceLayout];
      expect(insertPanelInLayout(newLayout, referenceLayout, layouts)).toEqual([
        referenceLayout,
        {
          x: 1,
          y: 4,
          ...newLayout,
        },
      ]);
    });

    test('with a single panel in the same row and additional panels below', () => {
      const newLayout: UnpositionedPanelGroupItemLayout = { i: 'abc', w: 10, h: 8 };
      const referenceLayout: PanelGroupItemLayout = {
        i: 'one',
        x: 0,
        y: 0,
        w: 18,
        h: 4,
      };
      const nextRowItem: PanelGroupItemLayout = {
        i: 'two',
        x: 0,
        y: 4,
        w: 6,
        h: 6,
      };
      const layouts: PanelGroupItemLayout[] = [referenceLayout, nextRowItem];

      expect(insertPanelInLayout(newLayout, referenceLayout, layouts)).toEqual([
        referenceLayout,
        {
          x: 0,
          y: 4,
          ...newLayout,
        },
        {
          ...nextRowItem,
          y: nextRowItem.y + newLayout.h,
        },
      ]);
    });
  });
});
