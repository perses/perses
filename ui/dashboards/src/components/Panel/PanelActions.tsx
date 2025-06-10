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
import { isValidElement, PropsWithChildren, ReactNode, useMemo, useState, useCallback } from 'react';
import { InfoTooltip } from '@perses-dev/components';
import { useDataQueriesContext } from '@perses-dev/plugin-system';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import MenuIcon from 'mdi-material-ui/Menu';
import AlertIcon from 'mdi-material-ui/Alert';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import DownloadIcon from 'mdi-material-ui/Download';
import { Link, TimeSeriesData, TimeSeries } from '@perses-dev/core';
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
  projectName?: string;
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

// Function to format labels similar to how Perses displays them in legends
const formatLegendName = (series: TimeSeries, seriesIndex: number): string => {
  const seriesAny = series as TimeSeries & {
    formattedName?: string;
    legendName?: string;
    displayName?: string;
    legend?: string;
    labels?: Record<string, string>;
  };

  // First try the standard TimeSeries properties that Perses uses for legend display
  let legendName = series.formattedName || series.name;

  // If we still don't have a good name, try other potential properties
  if (!legendName || legendName === `Series ${seriesIndex + 1}`) {
    legendName = seriesAny.legendName || seriesAny.displayName || seriesAny.legend || series.name || '';
  }

  // If we have labels, construct a meaningful name using Perses-style formatting
  if ((!legendName || legendName === series.name) && series.labels) {
    const labels = series.labels;

    // Remove __name__ from labels for cleaner display (common Prometheus practice)
    const displayLabels = { ...labels };
    const metricName = displayLabels.__name__;
    delete displayLabels.__name__;

    // Create label pairs in the format key="value"
    const labelPairs = Object.entries(displayLabels)
      .filter(([value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}="${value}"`)
      .join(', ');

    if (metricName && labelPairs) {
      legendName = `${metricName}{${labelPairs}}`;
    } else if (metricName) {
      legendName = metricName;
    } else if (labelPairs) {
      legendName = `{${labelPairs}}`;
    } else {
      // Fallback to trying common labels
      legendName = labels.job || labels.instance || labels.metric || `Series ${seriesIndex + 1}`;
    }
  }

  // Final fallback
  if (!legendName || legendName.trim() === '') {
    legendName = `Series ${seriesIndex + 1}`;
  }

  return legendName;
};

// Function to sanitize column names for CSV (Excel/Sheets compatible)
const sanitizeColumnName = (name: string): string => {
  return name
    .replace(/[,"\n\r]/g, '_') // Replace CSV-problematic characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length for Excel compatibility
};

// Function to sanitize filename by replacing/removing invalid characters
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

// Function to format timestamp in ISO 8601 format (Excel/Sheets compatible)
const formatTimestampISO = (timestamp: number | string): string => {
  let timestampMs: number;

  // Handle different timestamp formats
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp; // Return original if can't parse
    }
    timestampMs = date.getTime();
  } else {
    // Convert Unix timestamp to milliseconds if needed
    timestampMs = timestamp > 1e10 ? timestamp : timestamp * 1000;
  }

  const date = new Date(timestampMs);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date(timestampMs).toISOString();
  }

  // Return ISO 8601 format which includes timezone information
  return date.toISOString();
};

const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
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
  projectName,
}) => {
  // Check if current data is time series data
  const hasTimeSeriesData = useMemo(() => isTimeSeriesData(queryResults), [queryResults]);

  const { isFetching, errors } = useDataQueriesContext();

  const csvExportHandler = useCallback(() => {
    if (
      !queryResults ||
      !queryResults.series ||
      !Array.isArray(queryResults.series) ||
      queryResults.series.length === 0
    ) {
      return;
    }

    let csvString = '';
    const result: Record<string, Record<string, unknown>> = {};
    const seriesInfo: Array<{ legendName: string; columnName: string; originalName: string }> = [];
    let validSeriesCount = 0;

    // Process each series and collect legend information
    for (let i = 0; i < queryResults.series.length; i++) {
      const series = queryResults.series[i];

      if (!series) {
        continue;
      }

      if (!Array.isArray(series.values) || series.values.length === 0) {
        continue;
      }

      const legendName = formatLegendName(series, i);
      const columnName = sanitizeColumnName(legendName);

      const currentSeriesInfo = {
        legendName,
        columnName: columnName || `Series_${i + 1}`,
        originalName: series.name || '',
      };

      seriesInfo.push(currentSeriesInfo);
      validSeriesCount++;

      // Process the time series data for this series
      for (let j = 0; j < series.values.length; j++) {
        const entry = series.values[j];

        if (!Array.isArray(entry) || entry.length < 2) {
          continue;
        }

        const timestamp = entry[0];
        const value = entry[1];

        // Skip null or undefined values but allow 0
        if (value === null || value === undefined) {
          continue;
        }

        // Format timestamp in ISO 8601 format
        const dateTime = formatTimestampISO(timestamp);

        if (!result[dateTime]) {
          result[dateTime] = {};
        }

        result[dateTime]![currentSeriesInfo.columnName] = value;
      }
    }

    // Check if we actually have data to export
    if (validSeriesCount === 0 || seriesInfo.length === 0) {
      alert('No valid data found to export to CSV.');
      return;
    }

    const timestampCount = Object.keys(result).length;
    if (timestampCount === 0) {
      alert('No valid timestamp data found to export to CSV.');
      return;
    }

    // Build CSV content - SIMPLIFIED FORMAT
    // Add column headers only
    const columnNames = seriesInfo.map((info) => info.columnName);
    csvString += `DateTime,${columnNames.join(',')}\n`;

    // Add data rows - sort by timestamp
    const sortedDateTimes = Object.keys(result).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      return dateA - dateB;
    });

    for (const dateTime of sortedDateTimes) {
      const rowData = result[dateTime];
      const values: string[] = [];

      if (rowData) {
        for (const columnName of columnNames) {
          const value = rowData[columnName];
          values.push(escapeCsvValue(value));
        }

        csvString += `${escapeCsvValue(dateTime)},${values.join(',')}\n`;
      }
    }

    // Create filename (keeping project name and title as requested)
    let filename = '';
    if (projectName) {
      filename = `${sanitizeFilename(projectName)}_${sanitizeFilename(title)}_data.csv`;
    } else {
      filename = `${sanitizeFilename(title)}_data.csv`;
    }

    // Create and download the file
    const blobCsvData = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const csvURL = URL.createObjectURL(blobCsvData);
    const link = document.createElement('a');
    link.href = csvURL;
    link.download = filename;

    // Ensure the link is added to the document for some browsers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(csvURL);
  }, [queryResults, title, projectName]);

  const csvExportButton = useMemo(() => {
    // Only show CSV export button if we have time series data
    if (!hasTimeSeriesData) {
      return null;
    }

    return (
      <InfoTooltip description="Export as CSV">
        <HeaderIconButton aria-label="CSV Export" size="small" onClick={csvExportHandler}>
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
    if (isFetching && hasData) {
      return <CircularProgress aria-label="loading" size="1.125rem" />;
    }
    const validErrors = (errors || []).filter((error) => error !== null);
    if (validErrors.length > 0) {
      const errorTexts = validErrors
        .map((e: unknown) => {
          if (typeof e === 'string') return e;
          if (e && typeof e === 'object') {
            const errorObj = e as { message?: string; toString?: () => string };
            return errorObj.message ?? errorObj.toString?.() ?? 'Unknown error';
          }
          return 'Unknown error';
        })
        .join('\n');

      return (
        <InfoTooltip description={errorTexts}>
          <HeaderIconButton aria-label="panel errors" size="small">
            <AlertIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      );
    }
  }, [queryResults, isFetching, errors]);

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
          <OverflowMenu title={title}>{csvExportButton}</OverflowMenu>
        </OnHover>
      </ConditionalBox>
    </>
  );
};

const OverflowMenu: React.FC<PropsWithChildren<{ title: string }>> = ({ children, title }) => {
  const [anchorPosition, setAnchorPosition] = useState<PopoverPosition>();

  // do not show overflow menu if there is no content
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
