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

import { TimeSeriesData } from '@perses-dev/core';

export const MOCK_TIME_SERIES_QUERY_RESULT_MULTIVALUE = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: {
      timeRange: {
        start: new Date(1666625490000),
        end: new Date(1666625535000),
      },
      stepMs: 24379,
      series: [
        {
          name: 'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"',
          values: [
            [1666479357903, 0.27700745551584494],
            [1666479382282, 0.27701284657366565],
          ],
          labels: {
            device: '/dev/vda1',
            env: 'demo',
            fstype: 'ext4',
            instance: 'demo.do.prometheus.io:9100',
            job: 'node',
            mountpoint: '/',
          },
        },
        {
          name: 'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
          values: [
            [1666479357903, 0.08486496097624885],
            [1666479382282, 0.08486496097624885],
          ],
          labels: {
            device: '/dev/vda15',
            env: 'demo',
            fstype: 'vfat',
            instance: 'demo.do.prometheus.io:9100',
            job: 'node',
            mountpoint: '/boot/efi',
          },
        },
      ],
    },
    dataUpdatedAt: 1666500979895,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: true,
  },
];

export const MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: {
      timeRange: {
        start: new Date(1666625535000),
        end: new Date(1666625535000),
      },
      stepMs: 24379,
      series: [
        {
          name: 'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"',
          values: [[1666479357903, 0.27700745551584494]],
          labels: {
            device: '/dev/vda1',
            env: 'demo',
            fstype: 'ext4',
            instance: 'demo.do.prometheus.io:9100',
            job: 'node',
            mountpoint: '/',
          },
        },
        {
          name: 'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
          values: [[1666479357903, 0.08486496097624885]],
          labels: {
            device: '/dev/vda15',
            env: 'demo',
            fstype: 'vfat',
            instance: 'demo.do.prometheus.io:9100',
            job: 'node',
            mountpoint: '/boot/efi',
          },
        },
      ],
    },
    dataUpdatedAt: 1666500979895,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: true,
  },
];

export const MOCK_TIME_SERIES_DATA_MULTIVALUE: TimeSeriesData = {
  timeRange: {
    start: new Date(1666625490000),
    end: new Date(1666625535000),
  },
  stepMs: 24379,
  series: [
    {
      name: 'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"',
      values: [
        [1666479357903, 0.27700745551584494],
        [1666479382282, 0.27701284657366565],
      ],
      labels: {
        device: '/dev/vda1',
        env: 'demo',
        fstype: 'ext4',
        instance: 'demo.do.prometheus.io:9100',
        job: 'node',
        mountpoint: '/',
      },
    },
    {
      name: 'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
      values: [
        [1666479357903, 0.08486496097624885],
        [1666479382282, 0.08486496097624885],
      ],
      labels: {
        device: '/dev/vda15',
        env: 'demo',
        fstype: 'vfat',
        instance: 'demo.do.prometheus.io:9100',
        job: 'node',
        mountpoint: '/boot/efi',
      },
    },
  ],
};

export const MOCK_TIME_SERIES_DATA_SINGLEVALUE: TimeSeriesData = {
  timeRange: {
    start: new Date(1666625535000),
    end: new Date(1666625535000),
  },
  stepMs: 24379,
  series: [
    {
      name: 'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"',
      values: [[1666479357903, 0.27700745551584494]],
      labels: {
        device: '/dev/vda1',
        env: 'demo',
        fstype: 'ext4',
        instance: 'demo.do.prometheus.io:9100',
        job: 'node',
        mountpoint: '/',
      },
    },
    {
      name: 'device="/dev/vda15", env="demo", fstype="vfat", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/boot/efi"',
      values: [[1666479357903, 0.08486496097624885]],
      labels: {
        device: '/dev/vda15',
        env: 'demo',
        fstype: 'vfat',
        instance: 'demo.do.prometheus.io:9100',
        job: 'node',
        mountpoint: '/boot/efi',
      },
    },
  ],
};

export const MOCK_NULL_QUERY_RESULT = [
  {
    status: 'success',
    fetchStatus: 'idle',
    isLoading: false,
    isSuccess: true,
    isError: false,
    data: {
      timeRange: {
        start: new Date(1677376110000),
        end: new Date(1677376410000),
      },
      stepMs: 15000,
      series: [
        {
          name: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          values: [
            [1677376110000, 40000000],
            [1677376125000, 40000000],
            [1677376140000, null],
            [1677376155000, null],
            [1677376170000, null],
            [1677376185000, null],
            [1677376200000, null],
            [1677376215000, 40013824],
            [1677376230000, 40038400],
            [1677376245000, 40054784],
            [1677376260000, 40071168],
            [1677376275000, 40075264],
            [1677376290000, 40091648],
            [1677376305000, 40099840],
            [1677376320000, 40120320],
            [1677376335000, 40128512],
            [1677376350000, 40153088],
            [1677376365000, 40165376],
            [1677376380000, 40177664],
            [1677376395000, 40194048],
            [1677376410000, 40198144],
          ],
          formattedName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          labels: {
            env: 'demo',
            instance: 'demo.do.prometheus.io:9100',
            job: 'node',
          },
        },
      ],
    },
    dataUpdatedAt: 1677376410000,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: true,
  },
];
