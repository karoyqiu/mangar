import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import useDynamicHeight from './api/useDynamicHeight';
import { currentPosition } from './entities/position';
import { Viewer } from './Viewer';

type ImageViewerProps = {
  dir: string;
  images: string[];
  pos: number;
};

const ImageViewer = React.forwardRef<Viewer, ImageViewerProps>((props: ImageViewerProps, ref) => {
  const { dir, images, pos } = props;
  const listRef = React.useRef<VariableSizeList>(null);
  const {
    estimatedHeight, updateEstimatedHeight, getRowHeight, setRowHeight, scrollTo, scrollToPos,
  } = useDynamicHeight<HTMLImageElement>({
    listRef,
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

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  React.useEffect(() => {
    setTimeout(scrollToPos, 100);
  }, [listRef, pos]);

  if (images.length === 0) {
    return null;
  }

  return (
    <AutoResizer onResize={updateEstimatedHeight}>
      {({ width, height }) => (
        <VariableSizeList
          ref={listRef}
          width={width}
          height={height}
          itemCount={images.length}
          itemSize={getRowHeight}
          estimatedItemSize={estimatedHeight}
          overscanCount={2}
          onItemsRendered={({ visibleStartIndex }) => {
            if (images.length > 0) {
              currentPosition.set(visibleStartIndex);
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
});

export default ImageViewer;
