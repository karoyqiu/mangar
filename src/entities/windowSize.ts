import { entity } from 'simpler-state';
import { Size } from '../api/size';

const windowSize = entity<Size>({ width: 0, height: 0 });

export default windowSize;
