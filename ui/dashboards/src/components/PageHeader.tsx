// Copyright 2022 The Perses Authors
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
import { combineSx } from '@perses-dev/components';

export function PageHeader(props: BoxProps) {
  const { children, sx, ...others } = props;
  return (
    <Box
      sx={combineSx(
        (theme) => ({
          padding: theme.spacing(1, 2),
          display: 'flex',
          justifyContent: ' space-between',
          alignItems: 'center',
        }),
        sx
      )}
      {...others}
    >
      {children}
    </Box>
  );
}
