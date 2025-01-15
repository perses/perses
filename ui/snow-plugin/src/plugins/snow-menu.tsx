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

import { ReactElement } from 'react';
import { MenuPlugin } from '@perses-dev/plugin-system/src/model/menu';
import { IconButton } from '@mui/material';
import SnowflakeIcon from 'mdi-material-ui/Snowflake';
import Snowfall from 'react-snowfall';
import { useLocalStorage } from '@perses-dev/app/src/utils/browser-storage';
import { useDarkMode } from '@perses-dev/app/src/context/DarkMode';

const SNOW_PREFERENCE_KEY = 'PERSES_ENABLE_SNOW';

/**
 * Creates a button that would opt in/out for the snowflakes fall.
 */
function SnowButton(): ReactElement | null {
  const { isDarkModeEnabled } = useDarkMode();
  const [isSnowing, setIsSnowing] = useLocalStorage<boolean>(SNOW_PREFERENCE_KEY, false);
  const isSnowTime = new Date().getMonth() === 11; // activated in December
  if (!isSnowTime) {
    return null;
  }

  return (
    <>
      {isSnowing && (
        <Snowfall
          color={isDarkModeEnabled ? 'white' : 'lightgray'}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 999,
          }}
        />
      )}
      <IconButton color="inherit" onClick={() => setIsSnowing(!isSnowing)}>
        <SnowflakeIcon />
      </IconButton>
    </>
  );
}

export const SnowMenu: MenuPlugin<void> = {
  createInitialOptions(): void {
    return;
  },
  Component: SnowButton,
};
