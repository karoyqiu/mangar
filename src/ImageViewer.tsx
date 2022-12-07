import { fromByteArray } from 'base64-js';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import imageSize from './entities/imageSize';
import windowSize from './entities/windowSize';

const encoder = new TextEncoder();

const encodeFilename = (dir: string, filename: string) => {
  const utf8 = encoder.encode(`${dir}/${filename}`);
  return fromByteArray(utf8);
};

const imageUrl = (dir: string, filename: string) => (
  `https://img.localhost/${encodeFilename(dir, filename)}`
);

type ImageViewerProps = {
  dir: string;
  images: string[];
  pos: number;
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images, pos } = props;
  const ratio = imageSize.use((value) => value.height / value.width);
  const windowWidth = windowSize.use((value) => value.width);
  const ref = React.useRef<FixedSizeList>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageSize.set({ width: img.naturalWidth, height: img.naturalHeight });
      ref.current?.scrollTo(pos);
    };
    img.src = imageUrl(dir, images[0]);
  }, [dir, images[0]]);

  return (
    <AutoResizer>
      {({ width, height }) => (
        <FixedSizeList
          ref={ref}
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={windowWidth * ratio}
          overscanCount={3}
          onScroll={({ scrollOffset, scrollUpdateWasRequested }) => {
            if (!scrollUpdateWasRequested && images.length > 0) {
              localStorage.setItem('pos', `${scrollOffset}`);
            }
          }}
        >
          {({ index, style }) => (
            <img
              style={style}
              src={imageUrl(dir, images[index])}
              alt=""
              width="100%"
            />
          )}
        </FixedSizeList>
      )}
    </AutoResizer>
  );
}
