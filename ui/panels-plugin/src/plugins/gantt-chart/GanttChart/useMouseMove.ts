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

import { useEffect, useState } from 'react';

interface UseMouseMoveProps {
  handleMouseMove: (e: MouseEvent) => void;
}

export function useMouseMove(props: UseMouseMoveProps): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const { handleMouseMove } = props;
  const [isResizing, setResizing] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setResizing(false);
    const stopMouseMove = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'inherit';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      stopMouseMove();
    }

    return stopMouseMove;
  }, [isResizing, handleMouseMove]);

  return [isResizing, setResizing];
}
