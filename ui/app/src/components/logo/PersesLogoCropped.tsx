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

import { ReactElement } from 'react';

interface PersesLogoCroppedProps {
  color?: string;
  width?: number;
  height?: number;
}

function PersesLogoCropped(props: PersesLogoCroppedProps): ReactElement {
  const { color = '#DE005D', width = 120, height = 120 } = props;
  return (
    <svg width={width} height={height} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M71.625 23H29.375C25.8542 23 23 25.8542 23 29.375C23 32.8958 25.8542 35.75 29.375 35.75H71.625C75.1458 35.75 78 32.8958 78 29.375C78 25.8542 75.1458 23 71.625 23Z"
        fill={color}
      />
      <path
        d="M91.625 43.75H49.375C45.8542 43.75 43 46.6042 43 50.125C43 53.6458 45.8542 56.5 49.375 56.5H91.625C95.1458 56.5 98 53.6458 98 50.125C98 46.6042 95.1458 43.75 91.625 43.75Z"
        fill={color}
      />
      <path
        d="M71.625 64.5H29.375C25.8542 64.5 23 67.3542 23 70.875C23 74.3958 25.8542 77.25 29.375 77.25H71.625C75.1458 77.25 78 74.3958 78 70.875C78 67.3542 75.1458 64.5 71.625 64.5Z"
        fill={color}
      />
      <path
        d="M36.625 85.25H29.375C25.8542 85.25 23 88.1042 23 91.625C23 95.1458 25.8542 98 29.375 98H36.625C40.1458 98 43 95.1458 43 91.625C43 88.1042 40.1458 85.25 36.625 85.25Z"
        fill={color}
      />
    </svg>
  );
}

export default PersesLogoCropped;
