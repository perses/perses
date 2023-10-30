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

import { Await, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { useSnackbar } from '@perses-dev/components';
import { ProjectResource } from '@perses-dev/core';
import { fetchProject } from '../model/project-client';

function GuardedProjectRoute() {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const { exceptionSnackbar } = useSnackbar();
  const [projectPromise, setProjectPromise] = useState<Promise<ProjectResource>>();

  useEffect(() => {
    if (projectName === undefined || projectName === '') {
      return;
    }
    setProjectPromise(
      fetchProject(projectName).catch((err) => {
        exceptionSnackbar(err);
        navigate('/');
        throw err;
      })
    );
  }, [exceptionSnackbar, navigate, projectName]);

  return (
    <Suspense fallback={<LinearProgress />}>
      <Await resolve={projectPromise}>
        <Outlet />
      </Await>
    </Suspense>
  );
}

export default GuardedProjectRoute;
