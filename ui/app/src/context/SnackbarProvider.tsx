// Copyright 2021 The Perses Authors
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

import { useCallback } from 'react';
import {
  SnackbarProvider as NotistackProvider,
  ProviderContext as NotistackContext,
  useSnackbar as useNotistack,
  SnackbarMessage,
  OptionsObject,
  SnackbarKey,
} from 'notistack';

export interface SnackbarContext extends NotistackContext {
  errorSnackbar: EnqueueFunction;
  infoSnackbar: EnqueueFunction;
  warningSnackbar: EnqueueFunction;
  successSnackbar: EnqueueFunction;

  /**
   * Useful for catch blocks where the error will be of type `unknown`, tries
   * to show the `message` property if passed an instance of `Error`.
   */
  exceptionSnackbar: (error: unknown, options?: SnackbarOptions) => SnackbarKey;
}

type EnqueueFunction = (
  message: SnackbarMessage,
  options?: SnackbarOptions
) => SnackbarKey;

type SnackbarOptions = Omit<OptionsObject, 'variant'>;

/**
 * Application-wide provider for showing snackbars/toasts.
 */
export const SnackbarProvider = NotistackProvider;

/**
 * Gets the SnackbarContext with methods for displaying snackbars/toasts.
 */
export function useSnackbar(): SnackbarContext {
  const { enqueueSnackbar, closeSnackbar } = useNotistack();

  // Create variant-specific callbacks
  const errorSnackbar = useEnqueueFunction(enqueueSnackbar, 'error');
  const infoSnackbar = useEnqueueFunction(enqueueSnackbar, 'info');
  const warningSnackbar = useEnqueueFunction(enqueueSnackbar, 'warning');
  const successSnackbar = useEnqueueFunction(enqueueSnackbar, 'success');

  const exceptionSnackbar: SnackbarContext['exceptionSnackbar'] = useCallback(
    (error, options) => {
      // Try to use message prop, but fallback to a default message that
      // will just stringify the error provided
      const message =
        error instanceof Error
          ? error.message
          : `An unexpected error occurred: ${error}`;

      return errorSnackbar(message, options);
    },
    [errorSnackbar]
  );

  return {
    enqueueSnackbar,
    closeSnackbar,
    errorSnackbar,
    infoSnackbar,
    warningSnackbar,
    successSnackbar,
    exceptionSnackbar,
  };
}

// Helper to create a variant-specific enqueue function
function useEnqueueFunction(
  enqueueSnackbar: NotistackContext['enqueueSnackbar'],
  variant: OptionsObject['variant']
): EnqueueFunction {
  return useCallback(
    (message, options) => {
      const allOptions: OptionsObject = {
        ...options,
        variant,
      };
      return enqueueSnackbar(message, allOptions);
    },
    [enqueueSnackbar, variant]
  );
}
