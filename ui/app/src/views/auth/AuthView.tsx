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

import { Button, Container, Divider, LinearProgress, TextField, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { useDarkMode } from '../../context/DarkMode';
import { useAuthMutation } from '../../model/auth-client';
import PersesLogoCropped from '../../components/logo/PersesLogoCropped';
import DarkThemePersesLogo from '../../components/logo/DarkThemePersesLogo';
import LightThemePersesLogo from '../../components/logo/LightThemePersesLogo';

function AuthView() {
  const { isDarkModeEnabled } = useDarkMode();
  const isLaptopSize = useMediaQuery(useTheme().breakpoints.up('sm'));
  const authMutation = useAuthMutation();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    authMutation.mutate(
      { login: login, password: password },
      {
        onSuccess: () => {
          successSnackbar(`Successfully login`);
        },
        onError: (err) => {
          exceptionSnackbar(err);
        },
      }
    );
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: isLaptopSize ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!isLaptopSize ? <PersesLogoCropped /> : isDarkModeEnabled ? <DarkThemePersesLogo /> : <LightThemePersesLogo />}
      <Divider
        orientation={isLaptopSize ? 'vertical' : 'horizontal'}
        variant="middle"
        flexItem
        sx={{ marginTop: isLaptopSize ? '30vh' : undefined, marginBottom: isLaptopSize ? '30vh' : undefined }}
      />
      <Container sx={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          label="Login"
          required
          sx={{ marginTop: '10px', marginBottom: '10px' }}
          onChange={(e) => setLogin(e.target.value)}
        />
        <TextField
          type="password"
          label="Password"
          required
          sx={{ marginBottom: '10px' }}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          variant="contained"
          disabled={authMutation.isLoading || login === '' || password === ''}
          onClick={() => handleLogin()}
        >
          Login
        </Button>
        {authMutation.isLoading && <LinearProgress />}
      </Container>
    </Container>
  );
}

export default AuthView;
