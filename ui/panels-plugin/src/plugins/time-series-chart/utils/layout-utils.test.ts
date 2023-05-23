import { createTheme } from '@mui/material';
import { generateChartsTheme } from '@perses-dev/components';
import { getTimeSeriesLayout } from './layout-utils';

const mockMuiTheme = createTheme({});
const mockChartsTheme = generateChartsTheme(mockMuiTheme, {});

describe('getTimeSeriesLayout', () => {
  it('without legend', () => {
    expect(
      getTimeSeriesLayout({
        contentDimensions: {
          width: 600,
          height: 400,
        },
        showYAxis: false,
        spec: {},
        muiTheme: mockMuiTheme,
        chartsTheme: mockChartsTheme,
      })
    ).toMatchSnapshot();
  });

  describe('with table legend', () => {
    it('positioned right', () => {
      expect(
        getTimeSeriesLayout({
          contentDimensions: {
            width: 600,
            height: 400,
          },
          showYAxis: true,
          spec: {
            legend: {
              mode: 'Table',
              position: 'Right',
            },
          },
          muiTheme: mockMuiTheme,
          chartsTheme: mockChartsTheme,
        })
      ).toMatchSnapshot();
    });

    it('positioned bottom', () => {
      expect(
        getTimeSeriesLayout({
          contentDimensions: {
            width: 600,
            height: 400,
          },
          showYAxis: true,
          spec: {
            legend: {
              mode: 'Table',
              position: 'Bottom',
            },
          },
          muiTheme: mockMuiTheme,
          chartsTheme: mockChartsTheme,
        })
      ).toMatchSnapshot();
    });
  });

  describe('with list legend', () => {
    it('positioned right', () => {
      expect(
        getTimeSeriesLayout({
          contentDimensions: {
            width: 600,
            height: 400,
          },
          showYAxis: true,
          spec: {
            legend: {
              mode: 'List',
              position: 'Right',
            },
          },
          muiTheme: mockMuiTheme,
          chartsTheme: mockChartsTheme,
        })
      ).toMatchSnapshot();
    });

    it('positioned bottom', () => {
      expect(
        getTimeSeriesLayout({
          contentDimensions: {
            width: 600,
            height: 400,
          },
          showYAxis: true,
          spec: {
            legend: {
              mode: 'List',
              position: 'Bottom',
            },
          },
          muiTheme: mockMuiTheme,
          chartsTheme: mockChartsTheme,
        })
      ).toMatchSnapshot();
    });
  });
});
