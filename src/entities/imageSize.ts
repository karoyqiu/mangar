import { entity } from 'simpler-state';
import { Size } from '../api/size';

const imageSize = entity<Size>({ width: 1, height: 1 });

export default imageSize;
