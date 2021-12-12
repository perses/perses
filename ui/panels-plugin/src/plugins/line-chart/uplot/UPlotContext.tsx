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
