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

import { Box, BoxProps } from '@mui/material';
import { combineSx } from '../utils';

interface SeriesMarkerProps extends BoxProps<'div'> {
  markerColor: string;
}

export function SeriesMarker(props: SeriesMarkerProps) {
  const { markerColor, sx } = props;
  return (
    <Box
      sx={combineSx(
        {
          display: 'inline-block',
          width: '11px',
          height: '11px',
          borderRadius: '2px',
          marginRight: 1,
          verticalAlign: 'top',
        },
        sx
      )}
      style={{ backgroundColor: markerColor }}
    ></Box>
  );
}
