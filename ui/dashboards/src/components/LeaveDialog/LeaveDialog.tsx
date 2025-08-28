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

import { DashboardResource, EphemeralDashboardResource } from '@perses-dev/core';
import { ReactNode, useEffect } from 'react';

export function LeaveDialog({
  original,
  current,
}: {
  original: DashboardResource | EphemeralDashboardResource | undefined;
  current: DashboardResource | EphemeralDashboardResource;
}): ReactNode {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): string | null => {
      if (JSON.stringify(original) === JSON.stringify(current)) {
        return null;
      }
      event.preventDefault();
      event.returnValue = ''; // Required for Chrome
      return ''; // Required for other browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [original, current]);

  return <></>;
}
