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
import { useEffect, useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useNativeAuthMutation, useIsAccessTokenExist } from '../../model/auth-client';
import { SignUpRoute } from '../../model/route';
import { useIsSignUpDisable } from '../../context/Config';
import { SignWrapper } from './SignWrapper';

function SignInView() {
  const isSignUpDisable = useIsSignUpDisable();
  const isAccessTokenExist = useIsAccessTokenExist();
  const authMutation = useNativeAuthMutation();
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

  const isSignInDisabled = () => {
    return authMutation.isPending || login === '' || password === '';
  };

  const handleKeypress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isSignInDisabled()) {
      return;
    }

    // Sign in on pressing Enter button
    if (e.charCode === 13) {
      handleLogin();
    }
  };

  useEffect(() => {
    if (isAccessTokenExist) {
      navigate('/');
    }
  });

  return (
    <SignWrapper>
      <TextField label="Username" required onChange={(e) => setLogin(e.target.value)} onKeyPress={handleKeypress} />
      <TextField
        type="password"
        label="Password"
        required
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeypress}
      />
      <Button variant="contained" disabled={isSignInDisabled()} onClick={() => handleLogin()}>
        Sign in
      </Button>
      {authMutation.isPending && <LinearProgress />}
      {!isSignUpDisable && (
        <Typography sx={{ textAlign: 'center' }}>
          Don&lsquo;t have an account yet?&nbsp;
          <Link underline="hover" component={RouterLink} to={SignUpRoute}>
            Register now
          </Link>
        </Typography>
      )}
    </SignWrapper>
  );
}

export default SignInView;
