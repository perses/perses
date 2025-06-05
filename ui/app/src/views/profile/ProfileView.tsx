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

import { Avatar, Box, Divider, Typography, useTheme } from '@mui/material';
import { lazy, ReactElement, Suspense, useState } from 'react';
import { useIsMobileSize } from '../../utils/browser-size';
import { useAuthorizationContext } from '../../context/Authorization';
import { ProfileSettings } from './ProfileSettings';

export enum ProfileSections {
  AUTHENTICATION,
  PERMISSIONS,
}

const ProfilePermissions = lazy(() => import('./ProfilePermissions'));

const ProfileView = (): ReactElement => {
  const theme = useTheme();
  const isMobileSize = useIsMobileSize();
  const [activeSection, setActiveSection] = useState<ProfileSections>(ProfileSections.PERMISSIONS);
  const { username } = useAuthorizationContext();

  const borderTheme = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  };

  const renderActiveSection = (): ReactElement | null => {
    switch (activeSection) {
      case ProfileSections.PERMISSIONS:
        return <ProfilePermissions />;
      default:
        return null;
    }
  };

  return (
    <Box
      data-testid="profile-view-container"
      sx={{
        display: 'flex',
        flexDirection: isMobileSize ? 'column' : 'row',
        padding: (theme) => theme.spacing(1, 2),
        width: '100%',
        gap: 2,
      }}
    >
      <Box
        component="nav"
        aria-label="Profile navigation"
        data-testid="profile-sidebar"
        sx={{
          ...borderTheme,
          display: 'flex',
          flexDirection: 'column',
          width: isMobileSize ? '100%' : '20%',
          height: 'fit-content',
        }}
      >
        <Box
          sx={{
            padding: (theme) => theme.spacing(1, 1),
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 1,
          }}
        >
          {/* TODO: Shouldn't we later add the user profile image? */}
          <Avatar aria-label={`User profile image for ${username}`} />
          <Typography
            variant="h1"
            sx={{
              textAlign: 'center',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {username}
          </Typography>
        </Box>
        <Divider />
        <ProfileSettings selectedView={activeSection} setSelectedView={setActiveSection} />
      </Box>
      <Box
        aria-live="polite"
        data-testid="profile-section-container"
        sx={{ width: isMobileSize ? '100%' : '80%', ...borderTheme }}
      >
        <Suspense>{renderActiveSection()}</Suspense>
      </Box>
    </Box>
  );
};

export default ProfileView;
