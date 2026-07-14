// Copyright 2024 The Perses Authors
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

import { ReactElement } from 'react';
import { Box } from '@mui/material';
import { useBranding } from '../model/branding-client';

export function PersesLoader(): ReactElement {
  const { data: branding } = useBranding();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: ({ palette }) => palette.background.default,
      }}
    >
      {branding?.logo && <img src={branding.logo} alt="logo" style={{ width: '10%' }} />}
    </Box>
  );
}
