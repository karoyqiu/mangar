import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
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

  const openDir = async () => {
    const selected = await open({
      directory: true,
      recursive: true,
    });

    if (selected) {
      const dir = Array.isArray(selected) ? selected[0] : selected;
      const f = await invoke<string[]>('read_images', { dir });

      setFiles(f);
      setMode('DIR');
    }
  };

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
        </SpeedDial>
        {mode === 'DIR' && <ImageViewer images={files} />}
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
