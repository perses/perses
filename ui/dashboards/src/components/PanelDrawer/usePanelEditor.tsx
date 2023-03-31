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

import { useCallback, useMemo, useState } from 'react';
import { PanelDefinition, QueryDefinition } from '@perses-dev/core';

/**
 * UsePanelEditor is used in PanelEditorForm
 * This hook stores the states of panel definition and returns the onChange handlers for each state
 */
export const usePanelEditor = (panelDefinition: PanelDefinition) => {
  const { display, plugin: pluginDefinition, queries: initialQueries } = panelDefinition.spec;
  const [name, setName] = useState(display.name);
  const [description, setDescription] = useState(display.description);
  const [plugin, setPlugin] = useState(pluginDefinition);

  // need to keep track of prevQueries if switching from a panel with no queries (ex: markdown) to one with queries
  const [prevQueries, setPrevQueries] = useState(initialQueries);
  const [currentQueries, setCurrentQueries] = useState(initialQueries);

  /**
   * If hideQueryEditor is true, set panelDefinition.spec.queries to undefined.
   * If hideQueryEditor is false and query is undefined, set panelDefinition.spec.queries to previous queries.
   */
  const setQueries = useCallback(
    (queries?: QueryDefinition[], hideQueryEditor?: boolean) => {
      if (queries === undefined) {
        if (hideQueryEditor) {
          setPrevQueries(currentQueries);
          setCurrentQueries(undefined);
        } else {
          setCurrentQueries(prevQueries);
        }
        return;
      }

      setPrevQueries(currentQueries);
      setCurrentQueries(queries ?? []);
    },
    [setCurrentQueries, currentQueries, prevQueries]
  );

  // reset panel definition
  const setPanelDefinition = useCallback(
    (panelDefinition: PanelDefinition) => {
      const { display, plugin, queries } = panelDefinition.spec;
      setName(display.name);
      setDescription(display.description);
      setPlugin(plugin);
      setQueries(queries);
    },
    [setName, setDescription, setPlugin, setQueries]
  );

  return useMemo(
    () => ({
      panelDefinition: {
        kind: 'Panel',
        spec: {
          display: { name, description },
          plugin,
          queries: currentQueries,
        },
      } as PanelDefinition,
      setName,
      setDescription,
      setQueries,
      setPlugin,
      setPanelDefinition,
    }),
    [name, description, plugin, currentQueries, setName, setDescription, setQueries, setPlugin, setPanelDefinition]
  );
};
