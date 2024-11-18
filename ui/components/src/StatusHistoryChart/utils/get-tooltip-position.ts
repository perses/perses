// Copyright 2024 The Perses Authors
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

import { TooltipComponentOption } from 'echarts';

export const getTooltipPosition: TooltipComponentOption['position'] = (...data) => {
  const point = data[0];
  const size = data[4];

  // calculate the position to avoid overflow
  const [x, y] = point;
  const { contentSize, viewSize } = size;

  const posX = x + contentSize[0] > viewSize[0] ? x - contentSize[0] : x;
  const posY = y + contentSize[1] > viewSize[1] ? y - contentSize[1] : y;

  return [posX, posY];
};
