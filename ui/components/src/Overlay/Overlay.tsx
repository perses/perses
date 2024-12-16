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

import { Skeleton, SkeletonOwnProps, Stack, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface TextOverlayProps {
  message: string;
}

export function TextOverlay(props: TextOverlayProps): ReactElement {
  const { message } = props;

  return (
    <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Typography>{message}</Typography>
    </Stack>
  );
}

interface NoDataOverlayProps {
  resource: string;
}

export function NoDataOverlay(props: NoDataOverlayProps): ReactElement {
  const { resource } = props;

  return <TextOverlay message={`No ${resource}`} />;
}

interface LoadingOverlayProps {
  variant?: SkeletonOwnProps['variant'];
}

export function LoadingOverlay(props: LoadingOverlayProps): ReactElement {
  const { variant = 'rounded' } = props;

  return (
    <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
      <Skeleton variant={variant} width="100%" height="30%" aria-label="Loading..." />
    </Stack>
  );
}
