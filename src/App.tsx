import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React from 'react';
import { message, open } from '@tauri-apps/api/dialog';

function App() {
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
      await message(Array.isArray(selected) ? selected[0] : selected);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
          tooltipTitle="Open"
          onClick={openDir}
        />
      </SpeedDial>
    </ThemeProvider>
  );
}

export default App;
