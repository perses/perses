import { Box, Typography } from '@mui/material';
import { NearbySeriesArray } from './nearby-series';
import { SeriesInfo } from './SeriesInfo';
import { getTooltipStyles } from './utils';

export interface AnnotationTooltipProps {
  series: NearbySeriesArray | null;
  cursorTransform: string;
}

export function AnnotationTooltip({ series, cursorTransform }: AnnotationTooltipProps) {
  if (series === null || series.length === 0) {
    return null;
  }

  return (
    <Box
      sx={(theme) => getTooltipStyles(theme)}
      style={{
        transform: cursorTransform,
      }}
    >
      {series.map(({ datumIdx, seriesIdx, seriesName, y, formattedY, markerColor, isClosestToCursor }) => {
        if (datumIdx === null || seriesIdx === null) return null;
        const key = seriesIdx.toString() + datumIdx.toString();

        return (
          <Box key={key}>
            <Typography>Annotations</Typography>
            <SeriesInfo
              key={key}
              seriesName={seriesName}
              y={y}
              formattedY={formattedY}
              markerColor={markerColor}
              totalSeries={series.length}
              wrapLabels={true}
              emphasizeText={isClosestToCursor}
            />
          </Box>
        );
      })}
    </Box>
  );
}
