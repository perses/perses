import { getTimeSeriesLayout } from './layout-utils';

describe('getTimeSeriesLayout', () => {
  it('handles simple chart', () => {
    expect(
      getTimeSeriesLayout({
        contentPadding: 20,
        contentDimensions: {
          width: 400,
          height: 400,
        },
        showYAxis: false,
        spec: {},
      })
    ).toMatchSnapshot();
  });
});
