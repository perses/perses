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

import { getNearbySeries } from './focused-series';

describe('getNearbySeries', () => {
  const seriesDataInput = [
    {
      name: 'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"',
      color: 'hsla(-141599372,50%,50%,0.8)',
      data: [
        [1640802142000, 0.27379628778100884],
        [1640802173000, 0.2738012031572572],
        [1640802204000, 0.27380611853350545],
        [1640802235000, 0.27381087534922954],
        [1640802266000, 0.2738157907254778],
        [1640802297000, 0.273820547541202],
        [1640802328000, 0.2738253043569261],
        [1640802359000, 0.27383259814103644],
        [1640802390000, 0.27383735495676054],
        [1640802421000, 0.2738422703330088],
        [1640802452000, 0.273847027148733],
        [1640802483000, 0.27385194252498124],
        [1640802514000, 0.27385669934070533],
        [1640802545000, 0.27386145615642943],
        [1640802576000, 0.2738663715326778],
        [1640802607000, 0.2738711283484019],
        [1640802638000, 0.274038251140843],
        [1640802669000, 0.2740430079565671],
      ],
    },
    {
      name: 'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
      color: 'hsla(569657620,50%,50%,0.8)',
      data: [
        [1640802142000, 0.08486496097624885],
        [1640802173000, 0.08486496097624885],
        [1640802204000, 0.08486496097624885],
        [1640802235000, 0.08486496097624885],
        [1640802266000, 0.08486496097624885],
        [1640802297000, 0.08486496097624885],
        [1640802328000, 0.08486496097624885],
        [1640802359000, 0.08486496097624885],
        [1640802390000, 0.08486496097624885],
        [1640802421000, 0.08486496097624885],
        [1640802452000, 0.08486496097624885],
        [1640802483000, 0.08486496097624885],
        [1640802514000, 0.08486496097624885],
        [1640802545000, 0.08486496097624885],
        [1640802576000, 0.08486496097624885],
        [1640802607000, 0.08486496097624885],
        [1640802638000, 0.08486496097624885],
        [1640802669000, 0.08486496097624885],
      ],
    },
  ];

  // https://echarts.apache.org/en/api.html#echartsInstance.convertFromPixel
  const pointInGrid = [1640802452000.2622, 0.09444444444444444]; // converted from chart.getZr() mousemove coordinates

  const xBuffer = 15500; // milliseconds
  const yBuffer = 0.05; // calculated from y axis interval

  const focusedSeriesOutput = [
    {
      date: 'Dec 29, 2021, 6:27:32 PM',
      datumIdx: 10,
      markerColor: 'hsla(569657620,50%,50%,0.8)',
      seriesIdx: 1,
      seriesName:
        'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
      x: 1640802452000,
      y: 0.08486496097624885,
    },
  ];

  it('should return focused series data for points nearby the cursor', () => {
    expect(getNearbySeries(seriesDataInput, pointInGrid, xBuffer, yBuffer)).toEqual(focusedSeriesOutput);
  });
});
