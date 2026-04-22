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

import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Box, Button, Divider, Toolbar } from '@mui/material';
import { useIsLaptopSize, useIsMobileSize } from '../../utils/browser-size';
import { AdminRoute, ConfigRoute } from '../../model/route';
import { useIsAuthEnabled, useIsExplorerEnabled } from '../../context/Config';
import { GlobalProject, useHasPartialPermission } from '../../context/Authorization';
import AppscodeLogoCropped from '../logo/AppscodeLogoCropped';
import ObserveLabel from '../logo/ObserveLabel';
import { BannerInfo } from '../BannerInfo';
import { ToolMenu } from './ToolMenu';
import { AccountMenu } from './AccountMenu';
import { ThemeSwitch } from './ThemeSwitch';
import { SearchBar } from './SearchBar/SearchBar';
import AppscodeLogo from '../logo/AppscodeLogo';

export default function Header(): JSX.Element {
  const isLaptopSize = useIsLaptopSize();
  const isMobileSize = useIsMobileSize();
  const isAuthEnabled = useIsAuthEnabled();
  const IsExplorerEnabled = useIsExplorerEnabled();

  const hasPartialPermission = useHasPartialPermission(['read'], GlobalProject, [
    'GlobalDatasource',
    'GlobalRole',
    'GlobalRoleBinding',
    'GlobalSecret',
    'GlobalVariable',
    'User',
  ]);

  return (
    <AppBar position="relative">
      <Toolbar
        sx={{
          backgroundColor: (theme) => theme.palette.designSystem.blue[700],
          '&': {
            minHeight: '50px',
            paddingLeft: 0,
            paddingRight: 0.75,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            flexShrink: isMobileSize ? 2 : 1,
            pl: isLaptopSize ? 2 : 0,
            gap: 1,
          }}
        >
          <Button
            component={RouterLink}
            to="/"
            sx={{
              padding: 0,
            }}
          >
            {isLaptopSize ? <AppscodeLogo /> : <AppscodeLogoCropped color="white" width={32} height={32} />}
          </Button>
          {isLaptopSize && <ObserveLabel />}
        </Box>
        <SearchBar />
        <Box
          sx={{
            width: '100%',
            flexShrink: isMobileSize ? 2 : 1,
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          {isAuthEnabled ? <AccountMenu /> : <ThemeSwitch isAuthEnabled={false} />}
        </Box>
      </Toolbar>
      <BannerInfo />
    </AppBar>
  );
}
