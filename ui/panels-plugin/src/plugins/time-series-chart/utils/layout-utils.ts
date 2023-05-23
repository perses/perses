import { LegendOptions, PersesChartsTheme, getTableCellLayout } from '@perses-dev/components';
import type { GridComponentOption } from 'echarts';
import { Theme } from '@mui/material';
import { TimeSeriesChartProps } from '../TimeSeriesChartPanel';
import {
  LIST_LEGEND_HEIGHT_LG,
  LIST_LEGEND_HEIGHT_SM,
  PANEL_HEIGHT_LG_BREAKPOINT,
  TABLE_LEGEND_SIZE,
} from '../time-series-chart-model';

export type TimeSeriesLayoutOpts = {
  contentDimensions: TimeSeriesChartProps['contentDimensions'];
  spec: TimeSeriesChartProps['spec'];
  showYAxis: boolean;
  muiTheme: Theme;
  chartsTheme: PersesChartsTheme;
};

export type TimeSeriesLayoutConfig = {
  legend: {
    show: boolean;
    width: number;
    height: number;
  };
  chart: {
    grid: Pick<GridComponentOption, 'right' | 'bottom' | 'left'>;
  };
  content: {
    width: number;
    height: number;
  };
  padding: number;
};

interface GetLegendDimensionsOpts extends Pick<TimeSeriesLayoutOpts, 'muiTheme' | 'contentDimensions'> {
  adjustedContentDimensions: NonNullable<TimeSeriesChartProps['contentDimensions']>;
  legend?: LegendOptions;
}

function getLegendDimensions({
  muiTheme,
  adjustedContentDimensions,
  contentDimensions,
  legend,
}: GetLegendDimensionsOpts) {
  if (!legend) {
    return {
      width: 0,
      height: 0,
    };
  }

  const contentWidth = adjustedContentDimensions.width;
  const contentHeight = contentDimensions?.height ?? adjustedContentDimensions.height;

  // TODO: normalize table & list to size similarly when sizing options are
  // added.
  if (legend.mode === 'Table') {
    if (legend.position === 'Right') {
      return {
        width: TABLE_LEGEND_SIZE['Right'],
        height: contentHeight,
      };
    }
    // Position: Bottom

    // We need the table cell layout to properly size "bottom" aligned legends
    // based on the height of table cells.
    const tableCellLayout = getTableCellLayout(muiTheme, 'compact');
    const legendRowHeight = tableCellLayout.height;
    return {
      width: contentWidth,
      height: TABLE_LEGEND_SIZE['Bottom'] * legendRowHeight,
    };
  }

  // List mode
  if (legend.position === 'Right') {
    // TODO: account for number of time series returned when adjusting legend spacing
    return {
      width: 200,
      height: contentDimensions?.height || adjustedContentDimensions.height,
    };
  } else if (adjustedContentDimensions.height >= PANEL_HEIGHT_LG_BREAKPOINT) {
    return {
      width: contentWidth,
      height: LIST_LEGEND_HEIGHT_LG,
    };
  }

  return {
    width: contentWidth,
    height: LIST_LEGEND_HEIGHT_SM,
  };
}

export const getTimeSeriesLayout = ({
  spec: { legend, y_axis },
  contentDimensions,
  showYAxis,
  muiTheme,
  chartsTheme,
}: TimeSeriesLayoutOpts): TimeSeriesLayoutConfig | undefined => {
  // TODO: consider refactoring how the layout/spacing/alignment are calculated
  // the next time significant changes are made to the time series panel (e.g.
  // when making improvements to the legend to more closely match designs).
  // This may also want to include moving some of this logic down to the shared,
  // embeddable components.
  const padding = chartsTheme.container.padding.default;
  console.log(`padding: ${padding}`);

  const adjustedContentDimensions: typeof contentDimensions = contentDimensions
    ? {
        width: contentDimensions.width - padding * 2,
        height: contentDimensions.height - padding * 2,
      }
    : undefined;

  if (!adjustedContentDimensions) {
    return undefined;
  }

  const legendDimensions = getLegendDimensions({
    contentDimensions,
    adjustedContentDimensions,
    legend,
    muiTheme,
  });
  const legendWidth = legendDimensions.width;
  const legendHeight = legendDimensions.height;

  // override default spacing, see: https://echarts.apache.org/en/option.html#grid
  const gridLeft = y_axis && y_axis.label ? 30 : 20;
  const gridOverrides: GridComponentOption = {
    left: !showYAxis ? 0 : gridLeft,
    right: legend && legend.position === 'Right' ? legendWidth : 20,
    bottom: legend && legend.position === 'Bottom' ? legendHeight : 0,
  };

  return {
    padding,
    content: { width: adjustedContentDimensions.width, height: adjustedContentDimensions.height },
    legend: {
      show: !!legend,
      width: legendWidth,
      height: legendHeight,
    },
    chart: {
      grid: gridOverrides,
    },
  };
};
