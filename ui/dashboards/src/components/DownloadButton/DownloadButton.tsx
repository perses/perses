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

import { useRef } from 'react';
import DownloadIcon from 'mdi-material-ui/DownloadOutline';
import { InfoTooltip } from '@perses-dev/components';
import { TOOLTIP_TEXT } from '../../constants';
import { useDashboard } from '../../context';
import { ToolbarIconButton } from '../ToolbarIconButton';

interface DownloadButtonProps {
  // The button look best at heights >= 28 pixels
  heightPx?: number;
}

// Button that enables downloading the dashboard as a JSON file
export function DownloadButton({ heightPx }: DownloadButtonProps) {
  const { dashboard } = useDashboard();
  const hiddenLinkRef = useRef<HTMLAnchorElement>(null);
  const height = heightPx === undefined ? undefined : `${heightPx}px`;

  const onDownloadButtonClick = () => {
    if (!hiddenLinkRef || !hiddenLinkRef.current) return;
    // Create blob URL
    const hiddenLinkUrl = URL.createObjectURL(
      new Blob([JSON.stringify(dashboard)], {
        type: 'application/json',
      })
    );
    // Simulate click
    hiddenLinkRef.current.href = hiddenLinkUrl;
    hiddenLinkRef.current.click();
    // Remove blob URL (for memory management)
    URL.revokeObjectURL(hiddenLinkUrl);
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.downloadDashboard}>
        <ToolbarIconButton aria-label={TOOLTIP_TEXT.downloadDashboard} onClick={onDownloadButtonClick} sx={{ height }}>
          <DownloadIcon />
        </ToolbarIconButton>
      </InfoTooltip>
      {/* Hidden link to download the dashboard as a JSON file */}
      {/* eslint-disable jsx-a11y/anchor-has-content */}
      {/* eslint-disable jsx-a11y/anchor-is-valid  */}
      <a ref={hiddenLinkRef} style={{ display: 'none' }} download={`${dashboard.metadata.name}.json`} />
    </>
  );
}
