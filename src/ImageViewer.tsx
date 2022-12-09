import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import useDynamicHeight from './api/useDynamicHeight';

type ImageViewerProps = {
  dir: string;
  images: string[];
  pos: number;
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images, pos } = props;
  const ref = React.useRef<VariableSizeList>(null);
  const {
    estimatedHeight, updateEstimatedHeight, getRowHeight, setRowHeight, scrollToPos,
  } = useDynamicHeight<HTMLImageElement>({
    ref,
    pos,
    getObjectRowHeight: (img) => {
      const ratio = img.naturalHeight / img.naturalWidth;
      return Math.floor(img.width * ratio);
    },
    getObjectSize: (img) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
    }),
  });

  React.useEffect(() => {
    setTimeout(scrollToPos, 100);
  }, [ref, pos]);

  if (images.length === 0) {
    return null;
  }

  return (
    <AutoResizer onResize={updateEstimatedHeight}>
      {({ width, height }) => (
        <VariableSizeList
          ref={ref}
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={getRowHeight}
          estimatedItemSize={estimatedHeight}
          onItemsRendered={({ visibleStartIndex }) => {
            if (images.length > 0) {
              store.set('pos', visibleStartIndex);
            }
          }}
        >
          {({ index, style }) => (
            <img
              style={style}
              src={convertFileSrc(`${dir}/${images[index]}`)}
              alt=""
              width="100%"
              onLoad={(e) => setRowHeight(index, e.target as HTMLImageElement)}
            />
          )}
        </VariableSizeList>
      )}
    </AutoResizer>
  );
}
