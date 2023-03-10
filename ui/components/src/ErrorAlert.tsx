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

import { useMemo } from 'react';
import { UserFriendlyError } from '@perses-dev/core';
import { Alert } from '@mui/material';

export interface ErrorAlertProps {
  error: Error;
}

/**
 * Shows an MUI Alert with the `Error.message` as its contents.
 */
export function ErrorAlert(props: ErrorAlertProps) {
  const { error } = props;

  const { errors: errorMessages } = useMemo(
    () => getUserFriendlyErrors(error, 'Failed to load response data.'),
    [error]
  );

  return <Alert severity="error">{errorMessages}</Alert>;
}

interface UserFriendlyErrors {
  errors: string[];
}

/**
 * Given a server error, determines the user-friendly message(s) to show.
 */
export function getUserFriendlyErrors(error: unknown, defaultMessage: string): UserFriendlyErrors {
  // UserFriendlyError messages can be shown as-is
  if (error instanceof UserFriendlyError) {
    const errorEvent = error as UserFriendlyError;
    return { errors: [errorEvent.message] };
  }

  // Otherwise, use the fallback/default message
  return { errors: [defaultMessage] };
}
