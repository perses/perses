import React, { useRef } from 'react';
import DownloadIcon from 'mdi-material-ui/DownloadOutline';
import { IconButton, styled } from '@mui/material';
import { useDashboard } from '../../context';

// Button to download the dashboard as a JSON file.
export function DownloadButton() {
  const { dashboard } = useDashboard();
  const hiddenLinkRef = useRef<HTMLAnchorElement>(null);

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
      <DownloadIconButton title="Download JSON" onClick={onDownloadButtonClick}>
        <DownloadIcon />
      </DownloadIconButton>
      {/* Hidden link to download the dashboard as a JSON file */}
      {/* eslint-disable jsx-a11y/anchor-has-content */}
      {/* eslint-disable jsx-a11y/anchor-is-valid  */}
      <a ref={hiddenLinkRef} style={{ display: 'none' }} download={`${dashboard.metadata.name}.json`} />
    </>
  );
}

const DownloadIconButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  padding: '4px',
  color: theme.palette.grey[900],
}));
