import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import { PDFPageProxy } from 'react-pdf';
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.vite';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import imageSize from './entities/imageSize';
import { RowHeights } from './ImageViewer';
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

  const getRowHeight = React.useCallback((index: number) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    return heights[index] || imageSize.get().height;
  }, []);

  const setRowHeight = React.useCallback((index: number, pdf: PDFPageProxy) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    store.set('rowHeights', {
      ...heights,
      [index]: pdf.height,
    });
    ref.current?.resetAfterIndex(index);

    if (index === 0) {
      imageSize.set({
        width: (pdf.originalWidth * 4) / 3,
        height: (pdf.originalHeight * 4) / 3,
      });
    }
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
    <AutoResizer>
      {({ width, height }) => (
        <Document
          file={convertFileSrc(file)}
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
