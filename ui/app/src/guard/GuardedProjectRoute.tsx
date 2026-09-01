// Copyright The Perses Authors
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

import { LinearProgress } from '@mui/material';
import { useSnackbar } from '@perses-dev/components';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { useProject } from '../model/project-client';

interface ProjectRouteContentProps {
  projectName: string;
}

function ProjectRouteContent({ projectName }: ProjectRouteContentProps): ReactElement {
  const navigate = useNavigate();
  const { exceptionSnackbar } = useSnackbar();
  const { error, isLoading } = useProject(projectName);

  useEffect(() => {
    if (error) {
      exceptionSnackbar(error);
      navigate('/');
    }
  }, [error, exceptionSnackbar, navigate]);

  if (isLoading || error) {
    return <LinearProgress />;
  }

  return <Outlet />;
}

function GuardedProjectRoute(): ReactElement {
  const { projectName } = useParams();
  if (projectName === undefined || projectName === '') {
    return <Outlet />;
  }
  return <ProjectRouteContent projectName={projectName} />;
}

export default GuardedProjectRoute;
