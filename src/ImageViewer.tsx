import { fromByteArray } from 'base64-js';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';

const encoder = new TextEncoder();

const encodeFilename = (dir: string, filename: string) => {
  const utf8 = encoder.encode(`${dir}/${filename}`);
  return fromByteArray(utf8).replaceAll('+', '-').replaceAll('/', '_');
};

const imageUrl = (dir: string, filename: string) => (
  `https://img.localhost/${encodeFilename(dir, filename)}`
);

type ImageViewerProps = {
  dir: string;
  images: string[];
  pos: number;
};

type RowHeights = {
  [key: number]: number;
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images, pos } = props;
  const ref = React.useRef<VariableSizeList>(null);
  const rowHeights = React.useRef<RowHeights>({});

  React.useEffect(() => {
    ref.current?.scrollTo(pos);
  }, [ref, pos]);

  return (
    <AutoResizer>
      {({ width, height }) => (
        <VariableSizeList
          ref={ref}
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={(index) => rowHeights.current[index] ?? 0}
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
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                const ratio = img.naturalHeight / img.naturalWidth;
                rowHeights.current = {
                  ...rowHeights.current,
                  [index]: img.width * ratio,
                };
                ref.current?.resetAfterIndex(index);
              }}
            />
          )}
        </VariableSizeList>
      )}
    </AutoResizer>
  );
}
