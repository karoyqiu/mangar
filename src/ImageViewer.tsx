import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import imageSize from './entities/imageSize';

type ImageViewerProps = {
  dir: string;
  images: string[];
  pos: number;
};

export type RowHeights = {
  [key: number]: number;
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images, pos } = props;
  const ref = React.useRef<VariableSizeList>(null);

  const calcEstimatedHeight = React.useCallback(() => {
    const heights = Object.values(store.get('rowHeights', {}) as RowHeights);

    if (heights.length === 0) {
      return 1;
    }

    const sum = heights.reduce((prev, value) => prev + value, 0);
    const h = sum / heights.length;
    console.log('EH', h);
    return h;
  }, []);

  const [estimatedHeight, setEstimatedHeight] = React.useState(calcEstimatedHeight);

  const getRowHeight = React.useCallback((index: number) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    return heights[index] || imageSize.get().height;
  }, []);

  const setRowHeight = React.useCallback((index: number, img: HTMLImageElement) => {
    const ratio = img.naturalHeight / img.naturalWidth;
    const heights = store.get('rowHeights', {}) as RowHeights;
    store.set('rowHeights', {
      ...heights,
      [index]: Math.floor(img.width * ratio),
    });

    if (imageSize.get().height <= 1) {
      imageSize.set({ width: img.naturalWidth, height: img.naturalHeight });

      if (Object.keys(heights).length === 0) {
        setEstimatedHeight(calcEstimatedHeight());
      }
    }

    ref.current?.resetAfterIndex(index);
  }, []);

  const scrollToPos = () => {
    ref.current?.scrollToItem(pos, 'start');
    const current = store.get('pos', 0) as number;

    if (current !== pos) {
      setTimeout(scrollToPos, 20);
    }
  };

  React.useEffect(() => {
    setTimeout(scrollToPos, 100);
  }, [ref, pos]);

  if (images.length === 0) {
    return null;
  }

  return (
    <AutoResizer onResize={() => setEstimatedHeight(calcEstimatedHeight())}>
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
