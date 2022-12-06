import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { appWindow } from '@tauri-apps/api/window';
import { createRoot } from 'react-dom/client';
import App from './App';
import windowSize from './entities/windowSize';
import './style.css';

const watchHeight = async () => {
  const size = await appWindow.innerSize();
  windowSize.set(size);

  await appWindow.onResized((event) => windowSize.set(event.payload));
};

watchHeight().catch(() => { });

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<App />);
