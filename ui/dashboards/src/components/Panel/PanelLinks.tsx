// We don't use <Icon>foo</Icon> because it will explode bundle size
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

export const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '4px',
}));

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

  if (links.length === 1 && links[0]) {
    const link = links[0];
    return (
      <InfoTooltip description={link.tooltip ?? link.name ?? link.url} enterDelay={100}>
        <HeaderIconButton
          aria-label="Panel links"
          size="small"
          onClick={() => window.open(link.url, link.targetBlank ? '_blank' : '_self')}
        >
          <LinkIcon
            icon={link.icon}
            aria-describedby="links-icon"
            fontSize="inherit"
            sx={{ color: (theme) => theme.palette.text.secondary }}
          />
        </HeaderIconButton>
      </InfoTooltip>
    );
  }

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
          <MenuItem key={link.url} onClick={() => window.open(link.url, link.targetBlank ? '_blank' : '_self')}>
            <ListItemIcon>
              <LinkIcon icon={link.icon} />
            </ListItemIcon>
            <ListItemText>{link.name ?? link.url}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
