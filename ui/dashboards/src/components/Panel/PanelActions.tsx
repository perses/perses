// Copyright 2025 The Perses Authors
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

import { Stack, Box, Popover, CircularProgress, styled, PopoverPosition } from '@mui/material';
import { isValidElement, PropsWithChildren, ReactNode, useMemo, useState } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import MenuIcon from 'mdi-material-ui/Menu';
import { QueryData } from '@perses-dev/plugin-system';
import AlertIcon from 'mdi-material-ui/Alert';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import DownloadIcon from 'mdi-material-ui/Download'; 
import { Link, TimeSeriesData } from '@perses-dev/core';
import {
  ARIA_LABEL_TEXT,
  HEADER_ACTIONS_CONTAINER_NAME,
  HEADER_MEDIUM_WIDTH,
  HEADER_SMALL_WIDTH,
  TOOLTIP_TEXT,
} from '../../constants';
import { HeaderIconButton } from './HeaderIconButton';
import { PanelLinks } from './PanelLinks';

export interface PanelActionsProps {
  title: string;
  description?: string;
  descriptionTooltipId: string;
  links?: Link[];
  extra?: React.ReactNode;
  editHandlers?: {
    onEditPanelClick: () => void;
    onDuplicatePanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  readHandlers?: {
    isPanelViewed?: boolean;
    onViewPanelClick: () => void;
  };
  queryResults: TimeSeriesData | undefined;
}

const ConditionalBox = styled(Box)({
  display: 'none',
  alignItems: 'center',
  flexGrow: 1,
  justifyContent: 'flex-end',
});

// Function to check if the data is time series data
const isTimeSeriesData = (data: TimeSeriesData | undefined): boolean => {
  return !!(data && data.series && Array.isArray(data.series) && data.series.length > 0);
};

export const PanelActions: React.FC<PanelActionsProps> = ({
  editHandlers,
  readHandlers,
  extra,
  title,
  description,
  descriptionTooltipId,
  links,
  queryResults,
}) => {
  const formatSeriesTitle = (seriesName: string, seriesIndex: number) => {
    return seriesName;
  };

  // Check if current data is time series data
  const hasTimeSeriesData = useMemo(() => isTimeSeriesData(queryResults), [queryResults]);

  const csvExportHandler = () => {
    if (!queryResults || !queryResults.series || !Array.isArray(queryResults.series) || queryResults.series.length === 0) {
      console.warn('No data available to export to CSV. queryResults:', queryResults);
      return;
    }

    let csvString = '';
    const result: Record<string, Record<string, any>> = {};
    const seriesNames: string[] = [];
    const seriesLegendNames: string[] = []; // This will hold the formatted legend names

    for (let i = 0; i < queryResults.series.length; i++) {
      const series = queryResults.series[i];

      if (!series?.name || !Array.isArray(series.values)) {
        continue;
      }

      const name = formatSeriesTitle(series.name, i);
      seriesNames.push(name);
      if (!name) {
        continue;
      }

      for (const entry of series.values) {
        const dateTime = new Date(entry[0]).toISOString();
        const value = entry[1];

        if (!result[dateTime]) {
          result[dateTime] = {};
        }
        result[dateTime]![name] = value;
      }
    }

    const uniqueSeriesNames = new Set(seriesNames);
    const uniqueSeriesArray = Array.from(uniqueSeriesNames);

    csvString = `DateTime,${uniqueSeriesArray.join(',')}\n`;

    const sortedDateTimes = Object.keys(result).sort();

    for (const dateTime of sortedDateTimes) {
      const temp: any[] = [];
      const rowData = result[dateTime];
      if(rowData) {
        for(const name of uniqueSeriesArray){
          temp.push(rowData[name] ?? '');
        }
      }
      csvString += `${dateTime},${temp.join(',')}\n`;
    }

    const blobCsvData = new Blob([csvString], { type: 'text/csv' });
    const csvURL = URL.createObjectURL(blobCsvData);
    const link = document.createElement('a');
    link.href = csvURL;
    link.download = `${title}_graphData.csv`;
    link.click();
  };

  const csvExportButton = useMemo(() => {
    // Only show CSV export button if we have time series data
    if (!hasTimeSeriesData) {
      return null;
    }

    return (
      <InfoTooltip description="Export as CSV">
        <HeaderIconButton
          aria-label="CSV Export"
          size="small"
          onClick={csvExportHandler}
        >
          <DownloadIcon fontSize="inherit" />
        </HeaderIconButton>
      </InfoTooltip>
    );
  }, [hasTimeSeriesData, csvExportHandler]);

  const descriptionAction = useMemo(() => {
    if (description && description.trim().length > 0) {
      return (
        <InfoTooltip id={descriptionTooltipId} description={description} enterDelay={100}>
          <HeaderIconButton aria-label="panel description" size="small">
            <InformationOutlineIcon
              aria-describedby="info-tooltip"
              aria-hidden={false}
              fontSize="inherit"
              sx={{ color: (theme) => theme.palette.text.secondary }}
            />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [descriptionTooltipId, description]);

  const linksAction = links && links.length > 0 && <PanelLinks links={links} />;
  const extraActions = editHandlers === undefined && extra;

  const queryStateIndicator = useMemo(() => {
    const hasData = queryResults && queryResults.series && queryResults.series.length > 0;
    const isFetching = false;
    const queryErrors: any[] = [];
    if (isFetching && hasData) {
      return <CircularProgress aria-label="loading" size="1.125rem" />;
    } else if (queryErrors.length > 0) {
      const errorTexts = queryErrors
        .map((q) => q.error)
        .map((e: any) => e?.message ?? e?.toString() ?? 'Unknown error')
        .join('\n');

      return (
        <InfoTooltip description={errorTexts}>
          <HeaderIconButton aria-label="panel errors" size="small">
            <AlertIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
  }, [queryResults]);

  const readActions = useMemo(() => {
    if (readHandlers !== undefined) {
      return (
        <InfoTooltip description={TOOLTIP_TEXT.viewPanel}>
          <HeaderIconButton
            aria-label={ARIA_LABEL_TEXT.viewPanel(title)}
            size="small"
            onClick={readHandlers.onViewPanelClick}
          >
            {readHandlers.isPanelViewed ? (
              <ArrowCollapseIcon fontSize="inherit" />
            ) : (
              <ArrowExpandIcon fontSize="inherit" />
            )}
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [readHandlers, title]);

  const editActions = useMemo(() => {
    if (editHandlers !== undefined) {
      // If there are edit handlers, always just show the edit buttons
      return (
        <>
          <InfoTooltip description={TOOLTIP_TEXT.editPanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.editPanel(title)}
              size="small"
              onClick={editHandlers.onEditPanelClick}
            >
              <PencilIcon fontSize="inherit" />
            </HeaderIconButton>
          </InfoTooltip>
          <InfoTooltip description={TOOLTIP_TEXT.duplicatePanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.duplicatePanel(title)}
              size="small"
              onClick={editHandlers.onDuplicatePanelClick}
            >
              <ContentCopyIcon
                fontSize="inherit"
                sx={{
                  // Shrink this icon a little bit to look more consistent
                  // with the other icons in the header.
                  transform: 'scale(0.925)',
                }}
              />
            </HeaderIconButton>
          </InfoTooltip>
          <InfoTooltip description={TOOLTIP_TEXT.deletePanel}>
            <HeaderIconButton
              aria-label={ARIA_LABEL_TEXT.deletePanel(title)}
              size="small"
              onClick={editHandlers.onDeletePanelClick}
            >
              <DeleteIcon fontSize="inherit" />
            </HeaderIconButton>
          </InfoTooltip>
        </>
      );
    }
    return undefined;
  }, [editHandlers, title]);

  const moveAction = useMemo(() => {
    if (editActions && !readHandlers?.isPanelViewed) {
      return (
        <InfoTooltip description={TOOLTIP_TEXT.movePanel}>
          <HeaderIconButton aria-label={ARIA_LABEL_TEXT.movePanel(title)} size="small">
            <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
    return undefined;
  }, [editActions, readHandlers, title]);

  const divider = <Box sx={{ flexGrow: 1 }}></Box>;

  // if the panel is in non-editing, non-fullscreen mode, show certain icons only on hover
  const OnHover = ({ children }: PropsWithChildren): ReactNode =>
    editHandlers === undefined && !readHandlers?.isPanelViewed ? (
      <Box sx={{ display: 'var(--panel-hover, none)' }}>{children}</Box>
    ) : (
      <>{children}</>
    );

  return (
    <>
      {/* small panel width: move all icons except move/grab to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(0, HEADER_SMALL_WIDTH)]: { display: 'flex' },
        })}
      >
        {divider}
        <OnHover>
          <OverflowMenu title={title}>
            {descriptionAction} {linksAction} {queryStateIndicator} {extraActions} {readActions} {editActions}
            {csvExportButton}
          </OverflowMenu>
          {moveAction}
        </OnHover>
      </ConditionalBox>

      {/* medium panel width: move edit icons to overflow menu */}
      <ConditionalBox
        sx={(theme) => ({
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).between(HEADER_SMALL_WIDTH, HEADER_MEDIUM_WIDTH)]: {
            display: 'flex',
          },
        })}
      >
        <OnHover>
          {descriptionAction} {linksAction}
        </OnHover>
        {divider} {queryStateIndicator}
        <OnHover>
          {extraActions} {readActions}
          <OverflowMenu title={title}>
            {editActions}
            {csvExportButton} 
          </OverflowMenu>
          {moveAction}
        </OnHover>
      </ConditionalBox>

      {/* large panel width: show all icons in panel header */}
      <ConditionalBox
        sx={(theme) => ({
          // flip the logic here; if the browser (or jsdom) does not support container queries, always show all icons
          display: 'flex',
          [theme.containerQueries(HEADER_ACTIONS_CONTAINER_NAME).down(HEADER_MEDIUM_WIDTH)]: { display: 'none' },
        })}
      >
        <OnHover>
          {descriptionAction} {linksAction}
        </OnHover>
        {divider} {queryStateIndicator}
        <OnHover>
          {extraActions} {readActions} {editActions} {moveAction}
          <OverflowMenu title={title}>
            {csvExportButton}
          </OverflowMenu>
        </OnHover>
      </ConditionalBox>
    </>
  );
};

const OverflowMenu: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  const [anchorPosition, setAnchorPosition] = useState<PopoverPosition>();

  // do not show overflow menu if there is no content (for example, edit actions are hidden)
  const hasContent = isValidElement(children) || (Array.isArray(children) && children.some(isValidElement));
  if (!hasContent) {
    return undefined;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>): undefined => {
    setAnchorPosition(event.currentTarget.getBoundingClientRect());
  };

  const handleClose = (): undefined => {
    setAnchorPosition(undefined);
  };

  const open = Boolean(anchorPosition);
  const id = open ? 'actions-menu' : undefined;

  return (
    <>
      <HeaderIconButton
        className="show-actions"
        aria-describedby={id}
        onClick={handleClick}
        aria-label={ARIA_LABEL_TEXT.showPanelActions(title)}
        size="small"
      >
        <MenuIcon fontSize="inherit" />
      </HeaderIconButton>
      <Popover
        id={id}
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ padding: 1 }} onClick={handleClose}>
          {children}
        </Stack>
      </Popover>
    </>
  );
};