import ClearIcon from '@mui/icons-material/Clear';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import React from 'react';
import ImageViewer from './ImageViewer';

const modes = ['DIR', 'PDF'] as const;
type Mode = typeof modes[number];

function App() {
  const [mode, setMode] = React.useState<Mode>('DIR');
  const [dir, setDir] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () => createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
      },
    }),
    [prefersDarkMode],
  );

  const openDir = React.useCallback(async () => {
    const selected = await open({
      directory: true,
      recursive: true,
    });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      const f = await invoke<string[]>('read_images', { dir: d });

      setDir(btoa(d));
      setFiles(f);
      setMode('DIR');
    }
  }, []);

  const clear = React.useCallback(() => {
    setFiles([]);
    setDir('');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <React.StrictMode>
        <SpeedDial
          ariaLabel="Menu"
          direction="down"
          icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<KeyboardArrowDownIcon />} />}
          FabProps={{ size: 'medium' }}
          sx={{
            position: 'absolute',
            top: (thm) => thm.spacing(2),
            left: (thm) => thm.spacing(2),
          }}
        >
          <SpeedDialAction
            icon={<FolderOpenIcon />}
            tooltipTitle="Open directory"
            onClick={openDir}
          />
          <SpeedDialAction
            icon={<ClearIcon />}
            tooltipTitle="Clear"
            onClick={clear}
          />
        </SpeedDial>
        <Box width="100vw" height="100vh" overflow="auto">
          {mode === 'DIR' && <ImageViewer dir={dir} images={files} />}
        </Box>
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
