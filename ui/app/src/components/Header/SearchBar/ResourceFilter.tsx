// Copyright The Perses Authors
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

import { Button, Checkbox, FormControlLabel, Popover, Stack, Typography } from '@mui/material';
import FilterIcon from 'mdi-material-ui/Filter';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, MouseEventHandler, ReactElement } from 'react';

import { RESOURCE_TYPE_TITLES } from './model';
import type { ResourceType } from './model';
import { ResourceIcon } from './ResourceIcon';

export interface IProps {
  appliedResources: Set<ResourceType>;
  apply: (resourceTypes: Set<ResourceType>) => void;
}

export const ELEMENT_PREFIXES = {
  checkbox: `resource-filter-checkbox-`,
  formControlLable: `resource-filter-label-`,
};

/* Wouldn't be interesting to preset this with user preferences? */
export function ResourceFilter(props: IProps): ReactElement {
  const { appliedResources: receivedAppliedResources, apply } = props;

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [appliedResources, setAppliedResources] = useState<Set<ResourceType>>(() => new Set(receivedAppliedResources));

  const handleCheckBox = useCallback(
    (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const resourceType = e.target.id.split(ELEMENT_PREFIXES.checkbox)[1] as ResourceType;
      if (!resourceType) {
        throw new Error('Invalid resource filter item!');
      }
      if (checked) {
        if (!appliedResources.has(resourceType)) {
          setAppliedResources((prev) => new Set([...prev, resourceType]));
        }
      } else {
        const newSet = new Set(appliedResources);
        newSet.delete(resourceType);
        setAppliedResources(newSet);
      }
    },
    [appliedResources],
  );

  const items = useMemo((): ReactElement | null => {
    return !open ? null : (
      <Stack sx={{ px: 2, py: 1, minWidth: '220px' }}>
        {Object.keys(RESOURCE_TYPE_TITLES)
          .toSorted()
          .map((item) => {
            const rt = item as ResourceType;
            return (
              <FormControlLabel
                id={`${ELEMENT_PREFIXES.formControlLable}${rt}`}
                label={RESOURCE_TYPE_TITLES[rt]}
                control={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <ResourceIcon resourceType={rt} />
                    <Checkbox
                      sx={{ p: '0.5' }}
                      size="small"
                      id={`${ELEMENT_PREFIXES.checkbox}${rt}`}
                      onChange={handleCheckBox}
                      checked={appliedResources.has(rt)}
                    />
                  </Stack>
                }
                key={rt}
                sx={{
                  m: 0,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  width: '100%',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              />
            );
          })}
      </Stack>
    );
  }, [appliedResources, open, handleCheckBox]);

  const handleClosePopover = useCallback(() => {
    setOpen(false);
    setAnchorEl(null);
  }, [setAnchorEl]);

  const handleApply = useCallback(() => {
    apply(appliedResources);
    handleClosePopover();
  }, [apply, appliedResources, handleClosePopover]);

  const resetClose: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      setAppliedResources(receivedAppliedResources);
      setAnchorEl(e.currentTarget);
      setOpen((prev) => !prev);
    },
    [setOpen, receivedAppliedResources],
  );

  return (
    <>
      <Button
        onClick={resetClose}
        variant="text"
        sx={{ marginRight: '8px' }}
        startIcon={<FilterIcon fontSize="small" />}
      >
        Resources
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            role: 'dialog',
            sx: {
              width: 280,
              borderRadius: 1.5,
              mt: 0.5,
            },
          },
        }}
      >
        <Stack direction="row" sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
          <FilterIcon fontSize="small" />
          <Typography variant="subtitle2">Search in</Typography>
        </Stack>
        {items}
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1}
          sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}
        >
          <Button disabled={!appliedResources.size} onClick={handleApply} size="small">
            Apply
          </Button>
          <Button onClick={resetClose} size="small" variant="contained">
            Cancel
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
