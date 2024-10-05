import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { PromQLExtension, CompleteConfiguration } from '@prometheus-io/codemirror-promql';
import { EditorView } from '@codemirror/view';
import { useTheme, InputLabel, Stack, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import DotsVertical from 'mdi-material-ui/DotsVertical';
import CloseIcon from 'mdi-material-ui/Close';
import { useMemo, useState } from 'react';

export type PromQLEditorProps = { completeConfig: CompleteConfiguration } & Omit<
  ReactCodeMirrorProps,
  'theme' | 'extensions'
>;

export function PromQLEditor({ completeConfig, ...rest }: PromQLEditorProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editorContent, setEditorContent] = useState(rest.value);
  const [isTreeViewVisible, setTreeViewVisible] = useState(true);

  const promQLExtension = useMemo(() => {
    return new PromQLExtension().activateLinter(false).setComplete(completeConfig).asExtension();
  }, [completeConfig]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowTreeView = () => {
    setTreeViewVisible(!isTreeViewVisible); // Toggle TreeView visibility
    setAnchorEl(null);
  };

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
  };

  return (
    <Stack position="relative">
      <InputLabel // reproduce the same kind of input label that regular MUI TextFields have
        shrink
        sx={{
          position: 'absolute',
          top: '-8px',
          left: '10px',
          padding: '0 4px',
          color: theme.palette.text.primary,
          zIndex: 1,
        }}
      >
        PromQL Expression
      </InputLabel>
      <CodeMirror
        {...rest}
        style={{ border: `1px solid ${theme.palette.divider}` }}
        theme={isDarkMode ? 'dark' : 'light'}
        basicSetup={{
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          foldGutter: false,
        }}
        extensions={[
          EditorView.lineWrapping,
          promQLExtension,
          EditorView.theme({
            '.cm-content': {
              paddingTop: '8px',
              paddingBottom: '8px',
              paddingRight: '40px',
            },
          }),
        ]}
        placeholder="Example: sum(rate(http_requests_total[5m]))"
        onChange={handleEditorChange}
      />
      {editorContent && editorContent.trim() !== '' && (
        <>
          <Tooltip title="Settings">
            <IconButton
              aria-label="Settings"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ position: 'absolute', right: '5px', top: '5px' }}
              size="small"
            >
              <DotsVertical sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
          <Menu id="long-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleShowTreeView}>{isTreeViewVisible ? 'Hide Tree View' : 'Show Tree View'}</MenuItem>
          </Menu>
          {isTreeViewVisible && <TreeView content={editorContent} onClose={() => setTreeViewVisible(false)} />}
        </>
      )}
    </Stack>
  );
}

const TreeView = ({ content, onClose }: { content: string; onClose: () => void }) => {
  const theme = useTheme();

  // temporary logic
  const formatContent = (input: string) => {
    let formatted = '';
    let tabCount = 0;

    for (const char of input) {
      if (char === '(') {
        tabCount++;
        formatted += `(${'\n' + '\t'.repeat(tabCount)}`;
      } else if (char === ')') {
        tabCount--;
        formatted += `\n${'\t'.repeat(tabCount)}${char}`;
      } else {
        formatted += char;
      }
    }

    return formatted;
  };

  const modifiedContent = formatContent(content);

  return (
    <div style={{ border: `1px solid ${theme.palette.divider}`, padding: '10px', position: 'relative' }}>
      <Tooltip title="Close tree view">
        <IconButton
          aria-label="Close tree view"
          onClick={onClose} // Trigger the onClose function
          sx={{ position: 'absolute', top: '5px', right: '5px' }}
          size="small"
        >
          <CloseIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Tooltip>
      <pre style={{ margin: 0, minHeight: '16px' }}>{modifiedContent}</pre>
    </div>
  );
};
