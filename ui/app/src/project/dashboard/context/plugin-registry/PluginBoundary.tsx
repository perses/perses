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

import { ReactNode } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary';
import {
  PluginLoadingBoundary,
  PluginLoadingBoundaryProps,
} from './PluginLoadingBoundary';

export interface PluginBoundaryProps {
  loadingFallback: PluginLoadingBoundaryProps['fallback'];
  ErrorFallbackComponent: Required<ErrorBoundaryProps>['FallbackComponent'];
  children: ReactNode;
}

/**
 * Combination ErrorBoundary and PluginLoadingBoundary.
 */
export function PluginBoundary(props: PluginBoundaryProps) {
  const { ErrorFallbackComponent, loadingFallback, children } = props;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
      <PluginLoadingBoundary fallback={loadingFallback}>
        {children}
      </PluginLoadingBoundary>
    </ErrorBoundary>
  );
}
