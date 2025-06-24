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

import { ClickAwayListener, Menu, MenuItem, MenuList } from '@mui/material';
import { ToolbarIconButton } from '@perses-dev/components';
import DownloadIcon from 'mdi-material-ui/DownloadOutline';
import React, { ReactElement, useRef } from 'react';
import { stringify } from 'yaml';
import { useDashboard } from '../../context';

// Button that enables downloading the dashboard as a JSON file
export function DownloadButton(): ReactElement {
  const { dashboard } = useDashboard();
  const hiddenLinkRef = useRef<HTMLAnchorElement>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleItemClick = (format: 'json' | 'yaml', shape?: 'cr') => (): void => {
    setAnchorEl(null);

    let type,
      content = '';

    switch (format) {
      case 'json':
        type = 'application/json';
        content = JSON.stringify(dashboard, null, 2);
        break;
      case 'yaml':
        {
          type = 'application/yaml';

          if (shape === 'cr') {
            const name = dashboard.metadata.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            content = stringify({
              apiVersion: 'perses.dev/v1alpha1',
              kind: 'PersesDashboard',
              metadata: {
                labels: {
                  'app.kubernetes.io/name': 'perses-dashboard',
                  'app.kubernetes.io/instance': name,
                  'app.kubernetes.io/part-of': 'perses-operator',
                },
                name,
                namespace: dashboard.metadata.project,
              },
              spec: dashboard.spec,
            });
          } else {
            content = stringify(dashboard);
          }
        }
        break;
    }

    if (!hiddenLinkRef || !hiddenLinkRef.current) return;
    // Create blob URL
    const hiddenLinkUrl = URL.createObjectURL(new Blob([content], { type }));
    // Simulate click
    hiddenLinkRef.current.download = `${dashboard.metadata.name}${shape === 'cr' ? '-cr' : ''}.${format}`;
    hiddenLinkRef.current.href = hiddenLinkUrl;
    hiddenLinkRef.current.click();
    // Remove blob URL (for memory management)
    URL.revokeObjectURL(hiddenLinkUrl);
  };

  return (
    <>
      <ToolbarIconButton
        id="download-dashboard-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <DownloadIcon />
      </ToolbarIconButton>

      <Menu
        id="download-dashboard-formats"
        anchorEl={anchorEl}
        open={open}
        hideBackdrop={true}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'download-dashboard-button',
        }}
      >
        <div>
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <MenuList>
              <MenuItem onClick={handleItemClick('json')}>JSON</MenuItem>
              <MenuItem onClick={handleItemClick('yaml')}>YAML</MenuItem>
              <MenuItem onClick={handleItemClick('yaml', 'cr')}>YAML (CR)</MenuItem>
            </MenuList>
          </ClickAwayListener>
        </div>
      </Menu>

      {/* Hidden link to download the dashboard as a JSON or YAML file */}
      {/* eslint-disable jsx-a11y/anchor-has-content */}
      {/* eslint-disable jsx-a11y/anchor-is-valid  */}
      <a ref={hiddenLinkRef} style={{ display: 'none' }} />
    </>
  );
}
