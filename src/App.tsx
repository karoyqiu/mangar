import ClearIcon from '@mui/icons-material/Clear';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import RestoreIcon from '@mui/icons-material/Restore';
import WidthFullIcon from '@mui/icons-material/WidthFull';
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
import store from 'store';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import imageSize from './entities/imageSize';
import windowSize from './entities/windowSize';
import ImageViewer from './ImageViewer';
import PdfViewer from './PdfViewer';
import scrollBarWidth from './api/scrollBarWidth';

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
    store.set('mode', 'DIR');
    store.set('dir', d);
    setMode('DIR');
    setDir(d);
    setFiles(f);
  }, []);

  const openDir = React.useCallback(async () => {
    const selected = await open({ directory: true });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      store.remove('rowHeights');
      imageSize.set({ width: 1, height: 1 });
      await setDirectory(d);
      setPos(0);
    }
  }, []);

  const setPdf = React.useCallback((d: string) => {
    store.set('mode', 'PDF');
    store.set('dir', d);
    setMode('PDF');
    setDir(d);
    setFiles([]);
  }, []);

  const openPdf = React.useCallback(async () => {
    const selected = await open({
      filters: [{
        name: 'PDF files',
        extensions: ['pdf'],
      }],
    });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      store.remove('rowHeights');
      imageSize.set({ width: 1, height: 1 });
      setPdf(d);
    }
  }, []);

  const restore = React.useCallback(async () => {
    const d = store.get('dir') as string;
    const m = store.get('mode', 'DIR') as Mode;

    if (d) {
      const n = store.get('pos', 0) as number;

      if (m === 'DIR') {
        await setDirectory(d);
      } else {
        setPdf(d);
      }

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
    store.remove('dir');
    store.remove('pos');
    store.remove('rowHeights');
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
            tooltipTitle="Open directory for images"
            onClick={openDir}
          />
          <SpeedDialAction
            icon={<PictureAsPdfIcon />}
            tooltipTitle="Open PDF file"
            onClick={openPdf}
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
        {mode === 'PDF' && <PdfViewer file={dir} pos={pos} />}
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
