import { PersesChartsTheme, getTableCellLayout } from '@perses-dev/components';
import type { GridComponentOption, YAXisComponentOption } from 'echarts';
import { Theme } from '@mui/material';
import { TimeSeriesChartProps } from '../TimeSeriesChartPanel';
import { LEGEND_SIZE } from '../time-series-chart-model';

export type TimeSeriesLayoutOpts = {
  contentPadding: number;
  contentDimensions: TimeSeriesChartProps['contentDimensions'];
  spec: TimeSeriesChartProps['spec'];
  showYAxis: boolean;
  theme: Theme;
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

export const getTimeSeriesLayout = ({
  contentPadding,
  spec: { legend, y_axis },
  contentDimensions,
  showYAxis,
  theme,
}: TimeSeriesLayoutOpts): TimeSeriesLayoutConfig | undefined => {
  // TODO: consider refactoring how the layout/spacing/alignment are calculated
  // the next time significant changes are made to the time series panel (e.g.
  // when making improvements to the legend to more closely match designs).
  // This may also want to include moving some of this logic down to the shared,
  // embeddable components.
  const padding = contentPadding;
  const adjustedContentDimensions: typeof contentDimensions = contentDimensions
    ? {
        width: contentDimensions.width - padding * 2,
        height: contentDimensions.height - padding * 2,
      }
    : undefined;

  if (!adjustedContentDimensions) {
    return undefined;
  }

  const tableCellLayout = getTableCellLayout(theme, 'compact');
  const legendRowHeight = tableCellLayout.height;

  const legendWidth = legend && legend.position === 'Right' ? LEGEND_SIZE['Right'] : adjustedContentDimensions.width;
  const legendHeight =
    legend && legend.position === 'Bottom'
      ? LEGEND_SIZE['Bottom'] * legendRowHeight
      : contentDimensions?.height ?? adjustedContentDimensions.height;

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
