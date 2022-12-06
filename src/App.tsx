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
import { fromByteArray } from 'base64-js';
import React from 'react';
import RestoreIcon from '@mui/icons-material/Restore';
import ImageViewer from './ImageViewer';

const modes = ['DIR', 'PDF'] as const;
type Mode = typeof modes[number];

function App() {
  const [mode, setMode] = React.useState<Mode>('DIR');
  const [dir, setDir] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const box = React.useRef<HTMLDivElement>();

  const theme = React.useMemo(
    () => createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
      },
    }),
    [prefersDarkMode],
  );

  const setDirectory = React.useCallback(async (d: string) => {
    const f = await invoke<string[]>('read_images', { dir: d });
    localStorage.setItem('dir', d);

    const encoder = new TextEncoder();
    const utf8 = encoder.encode(d);
    const s = fromByteArray(utf8);
    setDir(s);
    setFiles(f);
    setMode('DIR');
  }, []);

  const openDir = React.useCallback(async () => {
    const selected = await open({ directory: true });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      await setDirectory(d);
    }
  }, []);

  const restore = React.useCallback(async () => {
    const d = localStorage.getItem('dir');

    if (d) {
      await setDirectory(d);
      const pos = parseInt(localStorage.getItem('pos') ?? '0', 10);

      // 给点加载时间
      setTimeout(() => box.current?.scrollTo(0, pos), pos / 50);
    }
  }, []);

  const clear = React.useCallback(() => {
    setFiles([]);
    setDir('');
    localStorage.removeItem('dir');
    localStorage.removeItem('pos');
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
            icon={<RestoreIcon />}
            tooltipTitle="Restore last session"
            onClick={restore}
          />
          <SpeedDialAction
            icon={<ClearIcon />}
            tooltipTitle="Clear"
            onClick={clear}
          />
        </SpeedDial>
        <Box
          width="100vw"
          height="100vh"
          overflow="auto"
          ref={box}
          // @ts-ignore 应该是存在 scrollTop 属性的
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          onScroll={(e) => localStorage.setItem('pos', `${e.target.scrollTop}`)}
        >
          {mode === 'DIR' && <ImageViewer dir={dir} images={files} />}
        </Box>
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
