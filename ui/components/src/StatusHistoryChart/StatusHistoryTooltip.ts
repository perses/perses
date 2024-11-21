import { css, Theme } from '@mui/material';
import { getDateAndTime } from '../utils';
import { StatusHistoryData } from './StatusHistoryChart';

interface CustomTooltipProps {
  data: StatusHistoryData;
  marker: string;
  xAxisCategories: number[];
  yAxisCategories: string[];
  theme: Theme;
}

export function generateTooltipHTML({
  data,
  marker,
  xAxisCategories,
  yAxisCategories,
  theme,
}: CustomTooltipProps): string {
  const [x, y, value] = data;
  const xAxisLabel = xAxisCategories[x];

  const { formattedDate, formattedTime } = xAxisLabel ? getDateAndTime(xAxisLabel) : {};

  const tooltipHeader = css`
    border-bottom: 1px solid ${theme.palette.grey[500]};
    padding-bottom: 8px;
  `;

  const tooltipContentStyles = css`
    display: flex;
    justify-content: space-between;
    padding-top: 8px;
  `;

  return `
    <div>
      <div style="${tooltipHeader.styles}">${formattedDate} ${formattedTime}</div>
      <div style="${tooltipContentStyles.styles}">
        <div>${marker} <strong>${yAxisCategories[y]}</strong>
        </div>
        <div>
          ${value}
        </div>
      </div>
    </div>
  `;
}
