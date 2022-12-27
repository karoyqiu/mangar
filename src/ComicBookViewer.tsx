import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import { useEntity } from 'simpler-state';
import store from 'store';
import useDynamicHeight from './api/useDynamicHeight';
import { currentPosition, maximumPosition } from './entities/position';
import Loading from './Loading';
import { Viewer } from './Viewer';

type ImageViewerProps = {
  file: string;
  pos: number;
};

const ImageViewer = React.forwardRef<Viewer, ImageViewerProps>((props: ImageViewerProps, ref) => {
  const { file, pos } = props;
  const [loading, setLoading] = React.useState(true);
  const pages = useEntity(maximumPosition);
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

  const loadFile = React.useCallback(async (f: string) => {
    if (f.length === 0) {
      return;
    }

    setLoading(true);

    // Load file
    const url = convertFileSrc(f, 'zip');
    const resp = await fetch(url);
    const text = await resp.text();
    maximumPosition.set(parseInt(text, 10));

    setLoading(false);
    setTimeout(scrollToPos, 100);
  }, []);

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  React.useEffect(() => {
    loadFile(file).catch(() => { });
  }, [file]);

  if (file.length === 0) {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <AutoResizer onResize={updateEstimatedHeight}>
      {({ width, height }) => (
        <VariableSizeList
          ref={listRef}
          width={width}
          height={height}
          itemCount={pages}
          itemSize={getRowHeight}
          estimatedItemSize={estimatedHeight}
          overscanCount={2}
          onItemsRendered={({ visibleStartIndex }) => {
            if (pages > 0) {
              currentPosition.set(visibleStartIndex);
              store.set('pos', visibleStartIndex);
            }
          }}
        >
          {({ index, style }) => (
            <img
              style={style}
              src={`${convertFileSrc(file, 'zip')}?${index}`}
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
