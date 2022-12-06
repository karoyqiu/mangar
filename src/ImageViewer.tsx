import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { useEntity } from 'simpler-state';
import { fromByteArray } from 'base64-js';
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
  const [ratio, setRatio] = React.useState(0);
  const wsize = useEntity(windowSize);
  const ref = React.useRef<FixedSizeList>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setRatio(img.naturalHeight / img.naturalWidth);
      ref.current?.scrollTo(pos);
    };
    img.src = imageUrl(dir, images[0]);
  }, [dir, images[0], pos]);

  return (
    <AutoResizer>
      {({ width, height }) => (
        <FixedSizeList
          ref={ref}
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={wsize.width * ratio}
          overscanCount={3}
          onScroll={({ scrollOffset }) => localStorage.setItem('pos', `${scrollOffset}`)}
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
