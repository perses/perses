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

import { ReactElement, useMemo, useState, MouseEvent } from 'react';
import { IconButton, Menu, MenuItem, Box, Typography, Avatar, ListItemText, ListItemIcon } from '@mui/material';
import ViewGrid from 'mdi-material-ui/ViewGrid';
import { useCookies } from 'react-cookie';

export interface AppDrawerProps {
  currentApp?: string;
  baseUrl?: string;
  activeOrganization?: string;
  rootDomain?: string;
  activeOrgType?: number;
  showBilling?: boolean;
}

const DEFAULT_APPS = [
  {
    name: 'id',
    icon_url: 'https://cdn.appscode.com/images/products/platform/platform.svg',
    title: 'Platform',
    port: '8080',
    sub_title: 'Manage your platform & accounts',
  },
  {
    name: 'db',
    icon_url: 'https://cdn.appscode.com/images/products/kubedb/kubedb-512x512_1.svg',
    title: 'KubeDB',
    port: '5996',
    sub_title: 'Manage your databases',
  },
  {
    name: 'grafana',
    icon_url: 'https://cdn.appscode.com/images/products/others/logos/grafana.svg',
    title: 'Grafana',
    port: '3005',
    sub_title: 'Analyze your activities',
  },
  {
    name: 'observe',
    icon_url: 'https://cdn.appscode.com/images/products/observe/logos/observe.svg',
    title: 'Observe',
    port: '8080',
    sub_title: 'Observe your activities',
  },
  {
    name: 'selfhost',
    icon_url: 'https://cdn.appscode.com/images/products/selfhost/logos/selfhost.svg',
    title: 'SelfHost',
    port: '5993',
    sub_title: 'Host AppsCode on your own cluster',
  },
  {
    name: 'billing',
    icon_url: 'https://cdn.appscode.com/images/products/billing/logos/billing.svg',
    title: 'Billing',
    port: '5995',
    sub_title: 'Manage your contracts, licenses & billings',
  },
  {
    name: 'learn',
    icon_url: 'https://cdn.appscode.com/images/products/learn/logos/learn.svg',
    title: 'Learn',
    port: '5988',
    sub_title: 'Be an Expert in Cloud Native technologies',
  },
];

export function AppDrawer(props: AppDrawerProps): ReactElement {
  const {
    currentApp = 'observe',
    baseUrl = window.location.origin,
    activeOrganization = '',
    rootDomain = window.location.hostname,
    activeOrgType = 0,
    showBilling = false,
  } = props;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setCookie] = useCookies(['gorg']);

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const appList = useMemo(() => {
    const list = [...DEFAULT_APPS];
    if (activeOrgType !== 3) {
      list.splice(1, 0, {
        name: 'console',
        icon_url: 'https://cdn.appscode.com/images/products/console/console_512x512.svg',
        title: 'Console',
        port: '5990',
        sub_title: 'Manage your kubernetes clusters',
      });
    }
    return list;
  }, [activeOrgType]);

  const getUrl = (product: (typeof DEFAULT_APPS)[0]) => {
    if (baseUrl.includes('bb.test')) {
      return `http://bb.test:${product.port}/${product.name}/`;
    }
    if (baseUrl.includes('localhost')) {
      return `http://localhost:${product.port}/${product.name}/`;
    }
    return `${baseUrl}/${product.name}/`;
  };

  const isSelfHosted = useMemo(() => {
    const list = ['https://appscode.ninja', 'https://appscode.com', 'http://bb.test:8080'];
    return !list.includes(baseUrl);
  }, [baseUrl]);

  const filteredAppList = useMemo(() => {
    return appList
      .filter((app) => {
        if (app.name === currentApp) return false;
        if (app.name === 'billing' && showBilling) return true;
        const selfHostList = ['billing', 'selfhost', 'learn'];
        if (isSelfHosted && selfHostList.includes(app.name)) return false;
        return true;
      })
      .map((app) => ({
        ...app,
        url: getUrl(app),
      }));
  }, [appList, currentApp, isSelfHosted, baseUrl, showBilling]);

  const handleClick = (name: string) => {
    if (name === 'grafana') {
      setCookie('gorg', activeOrganization, { domain: rootDomain, path: '/' });
    }
    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label="App drawer"
        sx={{
          border: '1px solid currentColor',
          borderRadius: '50%',
          p: '3px',
        }}
      >
        <ViewGrid sx={{ fontSize: '1.1rem' }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 258,
            mt: 1.5,
            overflow: 'visible',
            '&::after': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 15,
              height: 15,
              bgcolor: 'rgb(255,255,255)',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box>
          {filteredAppList.map((app) => (
            <MenuItem
              key={app.name}
              component="a"
              href={app.url}
              onClick={() => handleClick(app.name)}
              sx={{
                py: 1.5,
                px: 3,
                borderBottom: '1px solid #e2e8f0',
                '&:last-child': {
                  borderBottom: 0,
                },
                alignItems: 'flex-start',
                whiteSpace: 'normal',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: '10px' }}>
                <Avatar
                  src={app.icon_url}
                  variant="square"
                  sx={{ width: 32, height: 32, backgroundColor: 'transparent' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600 }}>{app.title}</Typography>}
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                    {app.sub_title}
                  </Typography>
                }
              />
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </>
  );
}
