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

import { Box } from '@mui/material';

interface SeriesMarkerProps {
  markerColor: string;
}

function SeriesMarker(props: SeriesMarkerProps) {
  const { markerColor } = props;
  return (
    <Box
      sx={{
        borderRadius: '2px',
        display: 'inline-block',
        height: '12px',
        marginRight: 1,
        marginTop: 0.25,
        verticalAlign: 'top',
        width: '12px',
      }}
      style={{ backgroundColor: markerColor }}
    ></Box>
  );
}

export default SeriesMarker;
