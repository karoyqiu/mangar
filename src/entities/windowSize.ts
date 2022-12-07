import { entity } from 'simpler-state';

type Size = {
  width: number;
  height: number;
};

const windowSize = entity<Size>({ width: 0, height: 0 });

export default windowSize;
