// Copyright 2023 The Perses Authors
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

import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import React, { ReactElement } from 'react';
import ShieldAccount from 'mdi-material-ui/ShieldAccount';
import { ProfileSections } from './ProfileView';

interface IAccountSettingItem {
  title: string;
  view: ProfileSections;
  icon: ReactElement;
}

interface ISettingItems {
  title: string;
  items: IAccountSettingItem[];
}

interface IProps {
  setSelectedView: (selectedView: ProfileSections) => void;
  selectedView: ProfileSections;
}

export const ProfileSettings = ({ selectedView, setSelectedView }: IProps): ReactElement => {
  const accountSettingsItems: IAccountSettingItem[] = [
    {
      title: 'Permissions and roles',
      view: ProfileSections.PERMISSIONS,
      icon: <ShieldAccount sx={{ fontSize: 24 }} />,
    },
  ];

  const settings: ISettingItems[] = [{ title: 'Account settings', items: accountSettingsItems }];

  const handleViewChange = (view: ProfileSections): void => {
    setSelectedView(view);
  };

  return (
    <Box
      data-testid="profile-settings-container"
      sx={{
        padding: (theme) => theme.spacing(1, 1),
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {settings.map((s) => (
        <React.Fragment key={s.title}>
          <Box
            key={s.title}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <Typography variant="h2">{s.title}</Typography>
          </Box>
          <List>
            {s.items.map((i) => (
              <ListItem
                role="button"
                key={i.view}
                onClick={() => handleViewChange(i.view)}
                sx={{
                  color: 'text.primary',
                  paddingY: 0.5,
                  cursor: 'pointer',
                  backgroundColor: selectedView === i.view ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {i.icon}
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="h3" sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {i.title}
                  </Typography>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        </React.Fragment>
      ))}
    </Box>
  );
};
