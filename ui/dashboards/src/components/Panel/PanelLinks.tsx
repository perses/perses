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

import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, styled, SxProps, Theme } from '@mui/material';
import LaunchIcon from 'mdi-material-ui/Launch';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import InformationBoxOutlineIcon from 'mdi-material-ui/InformationBoxOutline';
import HelpCircleOutlineIcon from 'mdi-material-ui/HelpCircleOutline';
import AlertCircleOutlineIcon from 'mdi-material-ui/AlertCircleOutline';
import LightningBoltIcon from 'mdi-material-ui/LightningBolt';
import DownloadIcon from 'mdi-material-ui/DownloadOutline';
import CogIcon from 'mdi-material-ui/Cog';
import { Link, LinkIcon } from '@perses-dev/core';
import { MouseEvent, useState } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';

export const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '4px',
}));

// Translate link type to MUI Icon. We don't use <Icon>foo</Icon> because it will explode bundle size
function LinkIcon({
  icon,
  ...props
}: {
  icon?: LinkIcon;
  sx?: SxProps<Theme> | undefined;
  fontSize?: 'small' | 'inherit' | 'large' | 'medium' | undefined;
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

export function PanelLinks({ links }: { links: Link[] }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpened = Boolean(anchorEl);
  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // If there is only one link, show it directly
  if (links.length === 1 && links[0]) {
    const link = links[0];
    return <LinkButton link={link} />;
  }

  // Else we show a menu with a list of all links
  return (
    <>
      <InfoTooltip description={`${links.length} links`} enterDelay={100}>
        <HeaderIconButton aria-label="Panel links" size="small" onClick={handleOpenMenu}>
          <LaunchIcon
            aria-describedby="links-icon"
            fontSize="inherit"
            sx={{ color: (theme) => theme.palette.text.secondary }}
          />
        </HeaderIconButton>
      </InfoTooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpened}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'panel-links',
        }}
      >
        {links.map((link: Link) => (
          <LinkMenuItem key={link.url} link={link} />
        ))}
      </Menu>
    </>
  );
}

function LinkButton({ link }: { link: Link }) {
  // TODO: can be optimized if replace variable is disabled?
  const url = useReplaceVariablesInString(link.url) ?? link.url;
  const name = useReplaceVariablesInString(link.name);
  const tooltip = useReplaceVariablesInString(link.tooltip);

  if (link.renderVariables === true) {
    return (
      <InfoTooltip description={tooltip ?? url} enterDelay={100}>
        <HeaderIconButton
          aria-label={name}
          size="small"
          onClick={() => window.open(url, link.targetBlank ? '_blank' : '_self')}
        >
          <LinkIcon icon={link.icon} fontSize="inherit" sx={{ color: (theme) => theme.palette.text.secondary }} />
        </HeaderIconButton>
      </InfoTooltip>
    );
  }

  return (
    <InfoTooltip description={link.tooltip ?? link.url} enterDelay={100}>
      <HeaderIconButton
        aria-label={link.name}
        size="small"
        onClick={() => window.open(link.url, link.targetBlank ? '_blank' : '_self')}
      >
        <LinkIcon icon={link.icon} fontSize="inherit" sx={{ color: (theme) => theme.palette.text.secondary }} />
      </HeaderIconButton>
    </InfoTooltip>
  );
}

function LinkMenuItem({ link }: { link: Link }) {
  // TODO: can be optimized if replace variable is disabled?
  const url = useReplaceVariablesInString(link.url) ?? link.url;
  const name = useReplaceVariablesInString(link.name);
  const tooltip = useReplaceVariablesInString(link.tooltip);

  if (link.renderVariables === true) {
    return (
      <InfoTooltip description={tooltip ?? url} enterDelay={100}>
        <MenuItem onClick={() => window.open(url, link.targetBlank ? '_blank' : '_self')}>
          <ListItemIcon>
            <LinkIcon icon={link.icon} />
          </ListItemIcon>
          <ListItemText>{name ?? url}</ListItemText>
        </MenuItem>
      </InfoTooltip>
    );
  }

  return (
    <InfoTooltip description={link.tooltip ?? link.url} enterDelay={100}>
      <MenuItem onClick={() => window.open(link.url, link.targetBlank ? '_blank' : '_self')}>
        <ListItemIcon>
          <LinkIcon icon={link.icon} />
        </ListItemIcon>
        <ListItemText>{link.name ?? link.url}</ListItemText>
      </MenuItem>
    </InfoTooltip>
  );
}
