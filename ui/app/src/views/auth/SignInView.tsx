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

import { Button, LinearProgress, Link, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuthMutation } from '../../model/auth-client';
import { SignUpRoute } from '../../model/route';
import { SignWrapper } from './SignWrapper';

function SignInView() {
  const authMutation = useAuthMutation();
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = () => {
    authMutation.mutate(
      { login: login, password: password },
      {
        onSuccess: () => {
          successSnackbar(`Successfully login`);
          navigate('/');
        },
        onError: (err) => {
          exceptionSnackbar(err);
        },
      }
    );
  };

  return (
    <SignWrapper>
      <TextField
        label="Username"
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
        Sign in
      </Button>
      {authMutation.isLoading && <LinearProgress />}
      <Typography>
        Don&lsquo;t have an account yet?&nbsp;
        <Link underline="hover" component={RouterLink} to={SignUpRoute}>
          Register now
        </Link>
      </Typography>
    </SignWrapper>
  );
}

export default SignInView;
