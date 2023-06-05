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

import { createTheme } from '@mui/material';
import { legendModes } from '@perses-dev/core';
import { ContentWithLegendLayoutOpts, getContentWithLegendLayout } from './content-with-legend-model';

const mockMuiTheme = createTheme({});

describe('getContentWithLegendLayout', () => {
  describe('without legend options', () => {
    const layoutOpts: ContentWithLegendLayoutOpts = {
      width: 400,
      height: 200,
      spacing: 0,
      minChildrenWidth: 0,
      minChildrenHeight: 0,
      theme: mockMuiTheme,
    };

    test('does not show legend', () => {
      const layout = getContentWithLegendLayout(layoutOpts);
      expect(layout.legend.show).toBeFalsy();
    });

    test('gives content full width and height without a margin', () => {
      const layout = getContentWithLegendLayout(layoutOpts);
      expect(layout.content.width).toEqual(layoutOpts.width);
      expect(layout.content.height).toEqual(layoutOpts.height);
      expect(layout.margin).toEqual({ bottom: 0, right: 0 });
    });
  });

  describe.each(legendModes)('%s mode legend', (mode) => {
    describe('with right oriented legend', () => {
      describe('with spacing', () => {
        const layoutOpts: ContentWithLegendLayoutOpts = {
          width: 800,
          height: 500,
          spacing: 10,
          minChildrenWidth: 0,
          minChildrenHeight: 0,
          legendOptions: {
            position: 'Right',
            mode: mode,
          },
          theme: mockMuiTheme,
        };

        test('shows legend', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.legend.show).toBeTruthy();
        });

        test('lays out the content, spacing, and legend horizontally', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.width + layout.margin.right + layout.legend.width).toEqual(layoutOpts.width);
        });

        test('content and legend use full height', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.height).toEqual(layoutOpts.height);
          expect(layout.legend.height).toEqual(layoutOpts.height);
        });
      });

      describe('without spacing', () => {
        const layoutOpts: ContentWithLegendLayoutOpts = {
          width: 800,
          height: 500,
          spacing: 0,
          minChildrenWidth: 0,
          minChildrenHeight: 0,
          legendOptions: {
            position: 'Right',
            mode: mode,
          },
          theme: mockMuiTheme,
        };

        test('shows legend', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.legend.show).toBeTruthy();
        });

        test('lays out the content, spacing, and legend horizontally', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.width + layout.legend.width).toEqual(layoutOpts.width);
        });

        test('content and legend use full height', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.height).toEqual(layoutOpts.height);
          expect(layout.legend.height).toEqual(layoutOpts.height);
        });
      });

      describe('without enough horizontal space for the legend', () => {
        const layoutOpts: ContentWithLegendLayoutOpts = {
          width: 200,
          height: 500,
          spacing: 10,
          minChildrenWidth: 200,
          minChildrenHeight: 0,
          legendOptions: {
            position: 'Right',
            mode: mode,
          },
          theme: mockMuiTheme,
        };

        test('does not show legend', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.legend.show).toBeFalsy();
        });

        test('gives content full width and height without a margin', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.width).toEqual(layoutOpts.width);
          expect(layout.content.height).toEqual(layoutOpts.height);
          expect(layout.margin).toEqual({ bottom: 0, right: 0 });
        });
      });
    });

    describe('with bottom oriented legend', () => {
      describe('with spacing', () => {
        const layoutOpts: ContentWithLegendLayoutOpts = {
          width: 800,
          height: 500,
          spacing: 15,
          minChildrenWidth: 0,
          minChildrenHeight: 0,
          legendOptions: {
            position: 'Bottom',
            mode: mode,
          },
          theme: mockMuiTheme,
        };

        test('shows legend', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.legend.show).toBeTruthy();
        });

        test('lays out the content, spacing, and legend vertically', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.height + layout.margin.bottom + layout.legend.height).toEqual(layoutOpts.height);
        });

        test('content and legend use full width', () => {
          const layout = getContentWithLegendLayout(layoutOpts);
          expect(layout.content.width).toEqual(layoutOpts.width);
          expect(layout.legend.width).toEqual(layoutOpts.width);
        });
      });
    });

    describe('without spacing', () => {
      const layoutOpts: ContentWithLegendLayoutOpts = {
        width: 800,
        height: 500,
        spacing: 0,
        minChildrenWidth: 0,
        minChildrenHeight: 0,
        legendOptions: {
          position: 'Bottom',
          mode: mode,
        },
        theme: mockMuiTheme,
      };

      test('shows legend', () => {
        const layout = getContentWithLegendLayout(layoutOpts);
        expect(layout.legend.show).toBeTruthy();
      });

      test('lays out the content, spacing, and legend horizontally', () => {
        const layout = getContentWithLegendLayout(layoutOpts);
        expect(layout.content.height + layout.legend.height).toEqual(layoutOpts.height);
      });

      test('content and legend use full width', () => {
        const layout = getContentWithLegendLayout(layoutOpts);
        expect(layout.content.width).toEqual(layoutOpts.width);
        expect(layout.legend.width).toEqual(layoutOpts.width);
      });
    });

    describe('without enough vertical space for the legend', () => {
      const layoutOpts: ContentWithLegendLayoutOpts = {
        width: 300,
        height: 100,
        spacing: 10,
        minChildrenWidth: 0,
        minChildrenHeight: 100,
        legendOptions: {
          position: 'Bottom',
          mode: mode,
        },
        theme: mockMuiTheme,
      };

      test('does not show legend', () => {
        const layout = getContentWithLegendLayout(layoutOpts);
        expect(layout.legend.show).toBeFalsy();
      });

      test('gives content full width and height without a margin', () => {
        const layout = getContentWithLegendLayout(layoutOpts);
        expect(layout.content.width).toEqual(layoutOpts.width);
        expect(layout.content.height).toEqual(layoutOpts.height);
        expect(layout.margin).toEqual({ bottom: 0, right: 0 });
      });
    });
  });
});
