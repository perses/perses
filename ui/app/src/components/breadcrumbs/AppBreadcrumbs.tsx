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

import { ReactNode } from 'react';
import { useIsMobileSize } from '../../utils/browser-size';
import { Breadcrumbs, HomeLinkCrumb, StackCrumb, TitleCrumb } from './breadcrumbs';

interface AppBreadcrumbsProps {
  rootPageName: string;
  icon: ReactNode;
}

function AppBreadcrumbs(props: AppBreadcrumbsProps) {
  const { rootPageName, icon } = props;

  const isMobileSize = useIsMobileSize();
  if (isMobileSize) {
    return (
      <Breadcrumbs>
        <StackCrumb>
          {icon}
          <TitleCrumb>{rootPageName}</TitleCrumb>
        </StackCrumb>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs>
      <HomeLinkCrumb />
      <StackCrumb>
        {icon}
        <TitleCrumb>{rootPageName}</TitleCrumb>
      </StackCrumb>
    </Breadcrumbs>
  );
}

export default AppBreadcrumbs;
