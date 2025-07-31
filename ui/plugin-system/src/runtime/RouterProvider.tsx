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

import React, { createContext, useContext, ReactNode, ReactElement, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

export interface RouterContextType {
  RouterComponent: (props: LinkProps & React.RefAttributes<HTMLAnchorElement>) => ReactNode;
  navigate: (to: string) => void;
}

export const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function useRouterContext(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (ctx === undefined) {
    throw new Error('No RouterContext found. Did you forget a <RouterProvider>?');
  }
  return ctx;
}

interface RouterProviderProps {
  RouterComponent: RouterContextType['RouterComponent'];
  navigate: RouterContextType['navigate'];
  children?: React.ReactNode;
}

/**
 * Some panel plugins (TraceTable, ScatterPlot, TracingGanttChart) support linking to other pages,
 * e.g. clicking on a trace in the TraceTable should navigate to the TracingGanttChart.
 *
 * We can't use react-router in the panel, because panels might be embedded into React applications
 * which use a different routing library, or a different major version of react-router.
 *
 * This provider abstracts the basic routing functionality, to remove the dependency on the exact version of react-router.
 */
export function RouterProvider(props: RouterProviderProps): ReactElement {
  const { RouterComponent, navigate, children } = props;

  const ctx = useMemo(() => {
    return { RouterComponent, navigate };
  }, [RouterComponent, navigate]);

  return <RouterContext.Provider value={ctx}>{children}</RouterContext.Provider>;
}

interface ReactRouterProviderProps {
  children?: React.ReactNode;
}

/** An implementation of RouterProvider for using the react-router library, shipped with Perses */
export function ReactRouterProvider(props: ReactRouterProviderProps): ReactElement {
  const { children } = props;
  const navigate = useNavigate();

  return (
    <RouterProvider RouterComponent={RouterLink} navigate={navigate}>
      {children}
    </RouterProvider>
  );
}
