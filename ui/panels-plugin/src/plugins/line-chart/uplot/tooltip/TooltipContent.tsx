import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { TooltipSeriesInfo } from './graph-tooltip';

const MAX_TOOLTIP_WIDTH = 400;

const tooltipMetricStyle: SxProps<Theme> = {
  maxWidth: MAX_TOOLTIP_WIDTH,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  flexGrow: 1,
};

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
});

function SeriesInfo(props: { focusedSeries: TooltipSeriesInfo | TooltipSeriesInfo[] }) {
  // TODO (sjcobb): add color badge marker
  let seriesInfo = props.focusedSeries;
  if (!Array.isArray(seriesInfo)) {
    seriesInfo = [seriesInfo];
  }
  return (
    <>
      {seriesInfo.map(({ name, y }) => (
        <Box display="flex" flex="column" alignItems="center" key={name}>
          <Box sx={tooltipMetricStyle}>{name}</Box>
          <Box>{y}</Box>
        </Box>
      ))}
    </>
  );
}

function TooltipContent(props: {
  top: number;
  left: number;
  x: number;
  focusedSeries: TooltipSeriesInfo | TooltipSeriesInfo[];
}) {
  const { focusedSeries, x, top, left } = props;
  // TODO (sjcobb): add isTooltipOffscreen check using container width instead of window.innerWidth
  const leftPosAdjusted = left + 15;

  return (
    <Box
      sx={{
        padding: (theme) => theme.spacing(1, 2),
        position: 'absolute',
        top: top,
        left: leftPosAdjusted,
        borderRadius: 2,
        maxWidth: MAX_TOOLTIP_WIDTH,
        backgroundColor: '#000',
        opacity: 0.9,
        fontSize: '11px',
        color: '#fff',
        zIndex: 1,
      }}
    >
      <Box>
        <b>{DATE_FORMAT.format(x * 1000)}</b>
      </Box>
      <SeriesInfo focusedSeries={focusedSeries} />
    </Box>
  );
}

export default TooltipContent;
