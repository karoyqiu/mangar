/* eslint-disable jsx-a11y/no-access-key */
import ClearIcon from '@mui/icons-material/Clear';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import RestoreIcon from '@mui/icons-material/Restore';
import ShortcutIcon from '@mui/icons-material/Shortcut';
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
import { GlobalHotKeys } from 'react-hotkeys';
import store from 'store';
import scrollBarWidth from './api/scrollBarWidth';
import ComicBookViewer from './ComicBookViewer';
import CurrentPosition from './CurrentPosition';
import imageSize from './entities/imageSize';
import { currentPosition, maximumPosition } from './entities/position';
import windowSize from './entities/windowSize';
import GotoDialog from './GotoDialog';
import ImageViewer from './ImageViewer';
import PdfViewer from './PdfViewer';
import TextViewer from './TextViewer';
import { Viewer } from './Viewer';

const FULL_SIZE_SCALE = 0.9 as const;

const keyMap = {
  OPEN_DIR: 'd',
  OPEN_FILE: 'f',
  RESTORE: 'r',
  GOTO: 'g',
  FULL_WIDTH: 'w',
  FULL_SIZE: 's',
  CLEAR: 'x',
} as const;

const modes = ['DIR', 'PDF', 'TXT', 'COMIC'] as const;
type Mode = typeof modes[number];

const guessMode = (filename: string) => {
  const low = filename.slice(-4).toLowerCase();

  switch (low) {
    case '.pdf':
      return 'PDF';
    case '.cbz':
    case '.cbr':
      return 'COMIC';
    default:
      return 'TXT';
  }
};

function App() {
  const [mode, setMode] = React.useState<Mode>('DIR');
  const [dir, setDir] = React.useState('');
  const [files, setFiles] = React.useState<string[]>([]);
  const [pos, setPos] = React.useState(0);
  const [gotoOpen, setGotoOpen] = React.useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const viewerRef = React.useRef<Viewer>(null);

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
    maximumPosition.set(f.length);
    setMode('DIR');
    setDir(d);
    setFiles(f);
  }, []);

  const openDir = React.useCallback(async () => {
    const selected = await open({ directory: true });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      store.remove('rowHeights');
      imageSize.set({ width: 1, height: 1000 });
      await setDirectory(d);
      setPos(0);
    }
  }, []);

  const setFile = React.useCallback((d: string) => {
    const m = guessMode(d);
    store.set('mode', m);
    store.set('dir', d);
    setMode(m);
    setDir(d);
    setFiles([]);
  }, []);

  const openFile = React.useCallback(async () => {
    const selected = await open({
      filters: [
        {
          name: 'All supported files',
          extensions: ['pdf', 'txt', 'cbz'],
        },
        {
          name: 'PDF files',
          extensions: ['pdf'],
        },
        {
          name: 'Text files',
          extensions: ['txt'],
        },
        {
          name: 'Comic books',
          extensions: ['cbz'],
        },
      ],
    });

    if (selected) {
      const d = Array.isArray(selected) ? selected[0] : selected;
      store.remove('rowHeights');
      imageSize.set({ width: 1, height: 1000 });
      setFile(d);
      setPos(0);
    }
  }, []);

  const goTo = React.useCallback(() => {
    setGotoOpen(true);
  }, []);

  const restore = React.useCallback(async () => {
    const d = store.get('dir') as string;
    const m = store.get('mode', 'DIR') as Mode;

    if (d) {
      const n = store.get('pos', 0) as number;

      if (m === 'DIR') {
        await setDirectory(d);
      } else {
        setFile(d);
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
    currentPosition.set(0);
    maximumPosition.set(0);
  }, []);

  const handlers = React.useMemo(() => ({
    OPEN_DIR: openDir,
    OPEN_FILE: openFile,
    RESTORE: restore,
    GOTO: () => {
      if (dir.length > 0) {
        goTo();
      }
    },
    FULL_WIDTH: async () => {
      if (dir.length > 0) {
        await fullWidth();
      }
    },
    FULL_SIZE: async () => {
      if (dir.length > 0) {
        await fullSize();
      }
    },
    CLEAR: () => {
      if (dir.length > 0) {
        clear();
      }
    },
  }), [dir]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <React.StrictMode>
        <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges>
          <SpeedDial
            ariaLabel="Menu"
            direction="down"
            icon={<SpeedDialIcon icon={<MenuIcon />} openIcon={<KeyboardArrowDownIcon />} />}
            FabProps={{ size: 'medium' }}
            sx={{
              position: 'absolute',
              top: (thm) => thm.spacing(1),
              left: (thm) => thm.spacing(1),
            }}
          >
            <SpeedDialAction
              icon={<FolderOpenIcon />}
              tooltipTitle="Open directory for images (D)"
              onClick={openDir}
            />
            <SpeedDialAction
              icon={<FileOpenIcon />}
              tooltipTitle="Open file (F)"
              onClick={openFile}
            />
            <SpeedDialAction
              icon={<RestoreIcon />}
              tooltipTitle="Restore last session (R)"
              onClick={restore}
            />
            <SpeedDialAction
              icon={<ShortcutIcon />}
              tooltipTitle="Go to page (G)"
              onClick={goTo}
              FabProps={{
                disabled: dir.length === 0,
              }}
            />
            <SpeedDialAction
              icon={<WidthFullIcon />}
              tooltipTitle="Full width (W)"
              onClick={fullWidth}
              FabProps={{
                disabled: dir.length === 0,
              }}
            />
            <SpeedDialAction
              icon={<FullscreenIcon />}
              tooltipTitle="Full size (S)"
              onClick={fullSize}
              FabProps={{
                disabled: dir.length === 0,
              }}
            />
            <SpeedDialAction
              icon={<ClearIcon />}
              tooltipTitle="Clear (X)"
              onClick={clear}
              FabProps={{
                disabled: dir.length === 0,
              }}
            />
          </SpeedDial>
          {mode === 'DIR' && <ImageViewer ref={viewerRef} dir={dir} images={files} pos={pos} />}
          {mode === 'PDF' && <PdfViewer ref={viewerRef} file={dir} pos={pos} />}
          {mode === 'TXT' && <TextViewer ref={viewerRef} file={dir} pos={pos} />}
          {mode === 'COMIC' && <ComicBookViewer ref={viewerRef} file={dir} pos={pos} />}
          <GotoDialog
            open={gotoOpen}
            onClose={(value) => {
              setGotoOpen(false);

              if (typeof value === 'number') {
                viewerRef.current?.scrollTo(value);
              }
            }}
          />
          <CurrentPosition />
        </GlobalHotKeys>
      </React.StrictMode>
    </ThemeProvider>
  );
}

export default App;
