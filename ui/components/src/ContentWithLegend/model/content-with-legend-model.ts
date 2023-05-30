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

import { LegendProps } from '../../Legend';

type Dimensions = {
  width: number;
  height: number;
};

export interface ContentWithLegendProps {
  /**
   * Width of the overall component layout in pixels.
   */
  width: number;
  /**
   * Height of overall component layout in pixels.
   */
  height: number;
  /**
   * Child content to render next to the legend. May be a react node or a
   * function that returns a react node. The function provides the expected
   * height and width for the content, which can be useful for passing down
   * to chart components.
   */
  children: React.ReactNode | (({ width, height }: Dimensions) => React.ReactNode);
  /**
   * Props to configure the legend. If not set, the content is rendered without
   * a legend.
   */
  legendProps?: Omit<LegendProps, 'width' | 'height'>;
  /**
   * Space to put between the children and the legend in pixels.
   */
  spacing?: number;

  /**
   * Minimum width required for the content specified by the `children` prop.
   * If this width cannot be maintained with a right positioned legend, the
   * legend will not be shown.
   */
  minChildrenWidth?: number;

  /**
   * Minimum height required for the content specified by the `children` prop.
   * If this width cannot be maintained with a bottom positioned legend, the
   * legend will not be shown.
   */
  minChildrenHeight?: number;
}

export interface ContentWithLegendLayoutOpts
  extends Required<Omit<ContentWithLegendProps, 'children' | 'legendProps'>> {
  legendOptions?: LegendProps['options'];
}

export interface ContentWithLegendLayout {
  legend: Dimensions & {
    show: boolean;
  };
  content: Dimensions;
  margin: {
    right: number;
    bottom: number;
  };
}

const PANEL_HEIGHT_LG_BREAKPOINT = 300;
const LEGEND_HEIGHT_SM = 40;
const LEGEND_HEIGHT_LG = 100;

/**
 * Returns information for laying out content alongside a legend.
 */
export function getContentWithLegendLayout({
  width,
  height,
  legendOptions,
  minChildrenHeight,
  minChildrenWidth,
  spacing,
}: ContentWithLegendLayoutOpts): ContentWithLegendLayout {
  const hasLegend = !!legendOptions;

  const noLegendLayout: ContentWithLegendLayout = {
    legend: {
      show: false,
      width: 0,
      height: 0,
    },
    content: {
      width,
      height,
    },
    margin: {
      right: 0,
      bottom: 0,
    },
  };

  if (!hasLegend) {
    return noLegendLayout;
  }

  const { position } = legendOptions;

  const legendWidth = position === 'Right' ? 200 : width;

  // TODO: account for number of legend items returned when adjusting legend spacing
  let legendHeight = LEGEND_HEIGHT_SM;
  if (position === 'Right') {
    legendHeight = height;
  } else if (height >= PANEL_HEIGHT_LG_BREAKPOINT) {
    legendHeight = LEGEND_HEIGHT_LG;
  }

  const contentWidth = position === 'Right' ? width - legendWidth - spacing : width;
  const contentHeight = position === 'Bottom' ? height - legendHeight - spacing : height;

  if (
    (position === 'Right' && contentWidth < minChildrenWidth) ||
    (position === 'Bottom' && contentHeight < minChildrenHeight)
  ) {
    // Legend does not fit. Just show the content.
    return noLegendLayout;
  }

  return {
    legend: {
      width: legendWidth,
      height: legendHeight,
      show: true,
    },
    content: {
      width: contentWidth,
      height: contentHeight,
    },
    margin: {
      right: position === 'Right' ? spacing : 0,
      bottom: position === 'Bottom' ? spacing : 0,
    },
  };
}
