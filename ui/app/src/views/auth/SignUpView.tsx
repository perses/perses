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

import { Button, LinearProgress, Link, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { SignInRoute } from '../../model/route';
import { useCreateUserMutation } from '../../model/user-client';
import { SignWrapper } from './SignWrapper';

function SignUpView() {
  const createUserMutation = useCreateUserMutation();
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstname, setFirstname] = useState<string>('');
  const [lastname, setLastname] = useState<string>('');

  const handleRegister = () => {
    createUserMutation.mutate(
      {
        kind: 'User',
        metadata: { name: login },
        spec: { firstName: firstname, lastName: lastname, password: password },
      },
      {
        onSuccess: () => {
          successSnackbar(`User ${login} successfully created`);
          navigate(SignInRoute);
        },
        onError: (err) => {
          exceptionSnackbar(err);
        },
      }
    );
  };

  return (
    <SignWrapper>
      <Stack direction="row" gap={1}>
        <TextField label="First name" onChange={(e) => setFirstname(e.target.value)} />
        <TextField label="Last name" onChange={(e) => setLastname(e.target.value)} />
      </Stack>
      <TextField label="Username" required onChange={(e) => setLogin(e.target.value)} />
      <TextField type="password" label="Password" required onChange={(e) => setPassword(e.target.value)} />
      <Button
        variant="contained"
        disabled={createUserMutation.isLoading || login === '' || password === ''}
        onClick={() => handleRegister()}
      >
        Register
      </Button>
      {createUserMutation.isLoading && <LinearProgress />}
      <Typography sx={{ textAlign: 'center' }}>
        Already have an account?&nbsp;
        <Link underline="hover" component={RouterLink} to={SignInRoute}>
          Sign in
        </Link>
      </Typography>
    </SignWrapper>
  );
}

export default SignUpView;
