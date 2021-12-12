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

import React, { useRef, useLayoutEffect, useMemo, useCallback, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { buildPlotContext, PlotContext } from './UPlotContext';

interface UPlotProps extends Omit<uPlot.Options, 'plugins'> {
  children: React.ReactNode;
  data: uPlot.AlignedData;
}

function UPlotContextProvider({ data, children, ...options }: UPlotProps) {
  const plotInstance = useRef<uPlot>();
  const [plugins, setPlugins] = useState<Map<string, uPlot.Plugin>>(new Map());
  const [plotCanvas, setPlotCanvas] = useState<HTMLDivElement | null>(null);
  const plotRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setPlotCanvas(node);
    }
  }, []);

  const getPlotInstance = useCallback(() => {
    return plotInstance.current;
  }, []);

  const registerPlugin = useCallback((id, hooks: uPlot.Plugin['hooks']) => {
    const plugin = { hooks };
    setPlugins((plugins) => {
      return new Map([...plugins, [id, plugin]]);
    });

    return function unregister() {
      setPlugins((plugins) => {
        plugins.delete(id);
        return new Map([...plugins]);
      });
    };
  }, []);

  useLayoutEffect(() => {
    if (plotInstance.current) {
      plotInstance.current.destroy();
    }

    if (plotCanvas === null) {
      return;
    }

    plotInstance.current = new uPlot(
      {
        ...options,
        plugins: Array.from(plugins.values()),
      },
      data,
      plotCanvas
    );
  }, [data, options, plugins, plotCanvas]);

  const plotContext = useMemo(() => {
    return buildPlotContext(plotCanvas, data, registerPlugin, getPlotInstance);
  }, [plotCanvas, data, getPlotInstance, registerPlugin]);

  return (
    <PlotContext.Provider value={plotContext}>
      <div ref={plotRef} />
      {children}
    </PlotContext.Provider>
  );
}

export default UPlotContextProvider;
