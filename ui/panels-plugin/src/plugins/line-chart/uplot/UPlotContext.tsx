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

import React, { useContext } from 'react';
import uPlot, { AlignedData, Series, Plugin } from 'uplot';

interface PlotContextType {
  getPlotInstance: () => uPlot | undefined;
  addPlotEventListeners: (id: string, listeners: Plugin['hooks']) => () => void;
  getSeries: () => Series[];
  plotCanvas: HTMLDivElement | null;
  data: AlignedData;
}

export const PlotContext = React.createContext<PlotContextType | undefined>(undefined);

export const usePlotContext = (): PlotContextType => {
  const ctx = useContext(PlotContext);
  if (ctx === undefined) {
    throw new Error('No PlotContext found. Did you forget the provider?');
  }
  return ctx;
};

export const buildPlotContext = (
  plotCanvas: HTMLDivElement | null,
  data: AlignedData,
  addPlotEventListeners: PlotContextType['addPlotEventListeners'],
  getPlotInstance: () => uPlot | undefined
): PlotContextType => {
  return {
    plotCanvas,
    data,
    addPlotEventListeners,
    getPlotInstance,
    getSeries: () => {
      const plotInstance = getPlotInstance();
      if (plotInstance !== undefined) {
        return plotInstance.series;
      }
      return [];
    },
  };
};
