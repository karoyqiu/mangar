import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { useEntity } from 'simpler-state';
import windowSize from './entities/windowSize';

type ImageViewerProps = {
  dir: string;
  images: string[];
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images } = props;
  const [ratio, setRatio] = React.useState(0);
  const wsize = useEntity(windowSize);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setRatio(img.naturalHeight / img.naturalWidth);
    img.src = `https://imgaaa.localhost/${dir}/${images[0]}`;
  }, [dir, images[0]]);

  return (
    <AutoResizer>
      {({ width, height }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={wsize.width * ratio}
          overscanCount={3}
        >
          {({ style, index }) => (
            <img
              style={style}
              src={`https://imgaaa.localhost/${dir}/${images[index]}`}
              alt=""
              width="100%"
            />
          )}
        </FixedSizeList>
      )}
    </AutoResizer>
  );
}
