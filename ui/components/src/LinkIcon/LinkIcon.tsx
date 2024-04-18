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

import { LinkIcon as Icon } from '@perses-dev/core';
import { SxProps, Theme } from '@mui/material';
import LaunchIcon from 'mdi-material-ui/Launch';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import InformationBoxOutlineIcon from 'mdi-material-ui/InformationBoxOutline';
import HelpCircleOutlineIcon from 'mdi-material-ui/HelpCircleOutline';
import AlertCircleOutlineIcon from 'mdi-material-ui/AlertCircleOutline';
import LightningBoltIcon from 'mdi-material-ui/LightningBolt';
import DownloadIcon from 'mdi-material-ui/DownloadOutline';
import CogIcon from 'mdi-material-ui/Cog';

// Translate link type to MUI Icon. We don't use <Icon>foo</Icon> because it will explode bundle size
export function LinkIcon({
  icon,
  ...props
}: {
  icon?: Icon;
  sx?: SxProps<Theme> | undefined;
  fontSize?: 'small' | 'inherit' | 'large' | 'medium' | undefined;
  href?: string;
  target?: string;
}) {
  switch (icon) {
    case 'external-link':
      return <LaunchIcon {...props} />;
    case 'dashboard-link':
      return <ViewDashboardIcon {...props} />;
    case 'info-link':
      return <InformationBoxOutlineIcon {...props} />;
    case 'question-link':
      return <HelpCircleOutlineIcon {...props} />;
    case 'danger-link':
      return <AlertCircleOutlineIcon {...props} />;
    case 'bolt-link':
      return <LightningBoltIcon {...props} />;
    case 'download-link':
      return <DownloadIcon {...props} />;
    case 'settings-link':
      return <CogIcon {...props} />;
  }
  return <LaunchIcon {...props} />;
}
