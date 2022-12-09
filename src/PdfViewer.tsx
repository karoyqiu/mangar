import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import { PDFPageProxy } from 'react-pdf';
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.vite';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import imageSize from './entities/imageSize';
import { RowHeights } from './ImageViewer';
import Loading from './Loading';
import scrollBarWidth from './scrollBarWidth';

if (window.location.hostname !== 'tauri.localhost') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

type PdfViewerProps = {
  file: string;
  pos: number;
};

export default function PdfViewer(props: PdfViewerProps) {
  const { file, pos } = props;
  const [pages, setPages] = React.useState(0);
  const ref = React.useRef<VariableSizeList>(null);

  const calcEstimatedHeight = React.useCallback(() => {
    const heights = Object.values(store.get('rowHeights', {}) as RowHeights);

    if (heights.length === 0) {
      return 1;
    }

    const sum = heights.reduce((prev, value) => prev + value, 0);
    return Math.floor(sum / heights.length);
  }, []);

  const [estimatedHeight, setEstimatedHeight] = React.useState(calcEstimatedHeight);

  const getRowHeight = React.useCallback((index: number) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    return heights[index] || imageSize.get().height;
  }, []);

  const setRowHeight = React.useCallback((index: number, pdf: PDFPageProxy) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    store.set('rowHeights', {
      ...heights,
      [index]: Math.floor(pdf.height),
    });

    if (imageSize.get().height <= 1) {
      imageSize.set({
        width: (pdf.originalWidth * 4) / 3,
        height: (pdf.originalHeight * 4) / 3,
      });

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

  if (file.length === 0) {
    return null;
  }

  return (
    <AutoResizer onResize={() => setEstimatedHeight(calcEstimatedHeight())}>
      {({ width, height }) => (
        <Document
          file={convertFileSrc(file)}
          loading={<Loading />}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts`,
          }}
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            setTimeout(scrollToPos, 100);
          }}
        >
          <VariableSizeList
            ref={ref}
            width={width}
            height={height}
            itemCount={pages}
            itemSize={getRowHeight}
            estimatedItemSize={estimatedHeight}
            onItemsRendered={({ visibleStartIndex }) => {
              if (pages > 0) {
                store.set('pos', visibleStartIndex);
              }
            }}
          >
            {({ index, style }) => (
              <div style={style}>
                <Page
                  pageIndex={index}
                  width={width - scrollBarWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onLoadSuccess={(pdf) => setRowHeight(index, pdf)}
                />
              </div>
            )}
          </VariableSizeList>
        </Document>
      )}
    </AutoResizer>
  );
}
