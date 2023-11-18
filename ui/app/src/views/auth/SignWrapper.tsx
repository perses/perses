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

import { Divider, Stack } from '@mui/material';
import { ReactNode } from 'react';
import { useDarkMode } from '../../context/DarkMode';
import PersesLogoCropped from '../../components/logo/PersesLogoCropped';
import DarkThemePersesLogo from '../../components/logo/DarkThemePersesLogo';
import LightThemePersesLogo from '../../components/logo/LightThemePersesLogo';
import { useIsLaptopSize } from '../../utils/browser-size';

export function SignWrapper(props: { children: ReactNode }) {
  const { isDarkModeEnabled } = useDarkMode();
  const isLaptopSize = useIsLaptopSize();
  return (
    <Stack
      width="100%"
      flexDirection={isLaptopSize ? 'row' : 'column'}
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      {!isLaptopSize ? <PersesLogoCropped /> : isDarkModeEnabled ? <DarkThemePersesLogo /> : <LightThemePersesLogo />}
      <Divider
        orientation={isLaptopSize ? 'vertical' : 'horizontal'}
        variant="middle"
        flexItem
        sx={{ marginTop: isLaptopSize ? '30vh' : undefined, marginBottom: isLaptopSize ? '30vh' : undefined }}
      />
      <Stack gap={1}>{props.children}</Stack>
    </Stack>
  );
}
