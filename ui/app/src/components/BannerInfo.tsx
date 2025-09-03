// Copyright 2025 The Perses Authors
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

import { Box, Alert } from '@mui/material';
import { ReactElement, useMemo } from 'react';
import { useBanner } from '../context/Config';
import { useLocalStorage } from '../utils/browser-storage';

/*
 * Banner displays if there is information regarding outages
 or general problems in Organisation's  tools ecosystem, provided by the config.
 */

const DISCARDED_BANNER = 'PERSES_BANNER_DISCARDED';

export function BannerInfo(): ReactElement | null {
  const banner = useBanner();
  const [discardedBanner, setDiscardedBanner] = useLocalStorage<string>(DISCARDED_BANNER, '');

  const isBannerEnabled = useMemo(() => banner?.message !== discardedBanner, [banner?.message, discardedBanner]);

  if (!banner || !isBannerEnabled) {
    return null;
  }

  return (
    <Box>
      <Alert
        sx={{
          '& .MuiAlert-message': {
            '& h1': { margin: (theme) => theme.spacing(0.5) },
          },
        }}
        severity={banner.severity}
        onClose={() => setDiscardedBanner(banner.message)}
      >
        <span dangerouslySetInnerHTML={{ __html: banner.message }}></span>
      </Alert>
    </Box>
  );
}
