// Copyright 2021 The Perses Authors
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

import { Box, Divider, Stack } from '@mui/material';
import SeriesMarker from './SeriesMarker';

interface SeriesInfoProps {
  seriesName: string;
  y: number;
  markerColor: string;
  totalSeries: number;
  wrapLabels?: boolean;
}

function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, y, markerColor, totalSeries, wrapLabels } = props;
  // TODO (sjcobb): regex to remove __name__ and quotes, replace = with :
  if (totalSeries === 1) {
    return (
      <Stack spacing={0.5}>
        <Box
          sx={{
            height: '16px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'left',
          }}
        >
          <SeriesMarker markerColor={markerColor} />
          <Box component="span" color="grey.300">
            value:
            <Box
              component="span"
              sx={{
                color: 'white',
                fontWeight: 700,
                paddingLeft: '2px',
              }}
            >
              {y}
            </Box>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'grey.800' }} />
        <Box>
          {seriesName.split(',').map((name) => {
            return (
              <Box key={name} color="grey.300">
                {name}
              </Box>
            );
          })}
        </Box>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: 'table-row',
        paddingTop: 0.5,
      }}
    >
      <Box
        sx={{
          display: 'table-cell',
          maxWidth: '550px',
        }}
      >
        <SeriesMarker markerColor={markerColor} />
        <Box
          component="span"
          sx={{
            color: 'grey.300',
            display: 'inline-block',
            maxWidth: '550px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: wrapLabels ? 'normal' : 'nowrap',
            width: 'calc(100% - 20px)',
          }}
        >
          {seriesName}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'table-cell',
          fontWeight: '700',
          paddingLeft: 1.5,
          textAlign: 'right',
          verticalAlign: 'top',
        }}
      >
        {y}
      </Box>
    </Box>
  );
}

export default SeriesInfo;
