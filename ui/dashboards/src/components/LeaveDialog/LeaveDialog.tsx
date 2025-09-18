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
import { ReactElement, ReactNode, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import type { BlockerFunction } from '@remix-run/router';

const handleRouteChange = (event: BeforeUnloadEvent): string => {
  event.preventDefault();
  event.returnValue = ''; // Required for Chrome
  return ''; // Required for other browsers
};

export interface LeaveDialogProps {
  isBlocked: BlockerFunction | boolean;
  message: string;
}

/*
 * Prompt component uses the useBlocker hook to block react-router navigation when there are unsaved changes.
 * It also listens to the beforeunload event to show a browser confirmation dialog when the user tries to close the tab, refresh the page or change url manually.
 */
export function Prompt({ isBlocked, message }: LeaveDialogProps): ReactElement {
  const blocker = useBlocker(isBlocked);
  const isBlockedState = blocker.state === 'blocked';
  const isProceedingState = blocker.state === 'proceeding';

  useEffect(() => {
    if (isBlocked) {
      window.addEventListener('beforeunload', handleRouteChange);
    } else {
      window.removeEventListener('beforeunload', handleRouteChange);
    }

    return (): void => {
      window.removeEventListener('beforeunload', handleRouteChange);
    };
  }, [blocker, isBlocked, isBlockedState]);

  const handleDiscardChanges = (): void => blocker.proceed?.();
  const handleCancel = (): void => blocker.reset?.();

  return (
    <DiscardChangesConfirmationDialog
      description={message}
      isOpen={isBlockedState || isProceedingState}
      onDiscardChanges={handleDiscardChanges}
      onCancel={handleCancel}
    />
  );
}

/*
 * LeaveDialog prompts the user with a confirmation dialog when they attempt to leave the page with unsaved changes.
 */
export function LeaveDialog({
  original,
  current,
}: {
  original: DashboardResource | EphemeralDashboardResource | undefined;
  current: DashboardResource | EphemeralDashboardResource;
}): ReactNode {
  const handleIsBlocked: BlockerFunction = (ctx) => {
    if (JSON.stringify(original) !== JSON.stringify(current)) {
      // Only block navigation if the pathname is changing (=> ignore search params changes)
      if (ctx.currentLocation.pathname !== ctx.nextLocation.pathname) {
        return true;
      }
    }
    return false;
  };

  return <Prompt isBlocked={handleIsBlocked} message="You have unsaved changes, are you sure you want to leave?" />;
}
