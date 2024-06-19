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

interface TextOverlayProps {
  message: string;
}

export function TextOverlay(props: TextOverlayProps) {
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

export function NoDataOverlay(props: NoDataOverlayProps) {
  const { resource } = props;

  return <TextOverlay message={`No ${resource}`} />;
}

interface LoadingOverlayProps {
  variant?: SkeletonOwnProps['variant'];
}

export function LoadingOverlay(props: LoadingOverlayProps) {
  const { variant = 'rounded' } = props;

  return (
    <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <Skeleton variant={variant} width="95%" height="30%" aria-label="Loading..." />
    </Stack>
  );
}
