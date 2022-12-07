import ClearIcon from '@mui/icons-material/Clear';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import RestoreIcon from '@mui/icons-material/Restore';
import CssBaseline from '@mui/material/CssBaseline';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow, currentMonitor, PhysicalSize } from '@tauri-apps/api/window';
import React from 'react';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import imageSize from './entities/imageSize';
import ImageViewer from './ImageViewer';
import windowSize from './entities/windowSize';

function getScrollbarWidth() {
  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  // outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

  // Removing temporary elements from the DOM
  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
}

const scrollBarWidth = getScrollbarWidth();
const FULL_SIZE_SCALE = 0.9 as const;

const modes = ['DIR', 'PDF'] as const;
type Mode = typeof modes[number];

function App() {
  const [mode, setMode] = React.useState<Mode>('DIR');
  const [dir, setDir] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const [pos, setPos] = React.useState(0);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

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
    setDir(d);
    setFiles(f);
    setMode('DIR');
  }, []);

  const openDir = React.useCallback(async () => {
    const selected = await open({ directory: true });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      await setDirectory(d);
      setPos(0);
    }
  }, []);

  const restore = React.useCallback(async () => {
    const d = localStorage.getItem('dir');

    if (d) {
      const n = parseInt(localStorage.getItem('pos') ?? '0', 10);
      await setDirectory(d);
      setPos(n);
    }
  }, []);

  const fullWidth = React.useCallback(async () => {
    const { width } = imageSize.get();
    const { height } = windowSize.get();
    const size = new PhysicalSize(width + scrollBarWidth, height);
    const monitor = await currentMonitor();

    if (monitor) {
      const maxWidth = Math.floor(monitor.size.width * FULL_SIZE_SCALE);

      if (size.width > maxWidth) {
        size.width = maxWidth;
      }
    }

    await appWindow.setSize(size);
    await appWindow.center();
  }, []);

  const fullSize = React.useCallback(async () => {
    const { width, height } = imageSize.get();
    const size = new PhysicalSize(width + scrollBarWidth, height);
    const monitor = await currentMonitor();

    if (monitor) {
      const maxWidth = Math.floor(monitor.size.width * FULL_SIZE_SCALE);
      const maxHeight = Math.floor(monitor.size.height * FULL_SIZE_SCALE);

      if (size.width > maxWidth) {
        const ratio = maxWidth / size.width;
        size.width = maxWidth;
        size.height = Math.floor(size.height * ratio);
      }

      if (size.height > maxHeight) {
        const ratio = maxHeight / size.height;
        size.height = maxHeight;
        size.width = Math.floor(size.width * ratio);
      }
    }

    await appWindow.setSize(size);
    await appWindow.center();
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
            icon={<WidthFullIcon />}
            tooltipTitle="Full width"
            onClick={fullWidth}
          />
          <SpeedDialAction
            icon={<FullscreenIcon />}
            tooltipTitle="Full size"
            onClick={fullSize}
          />
          <SpeedDialAction
            icon={<ClearIcon />}
            tooltipTitle="Clear"
            onClick={clear}
          />
        </SpeedDial>
        {mode === 'DIR' && <ImageViewer dir={dir} images={files} pos={pos} />}
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
