import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import { PDFPageProxy } from 'react-pdf';
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.vite';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import { useEntity } from 'simpler-state';
import store from 'store';
import scrollBarWidth from './api/scrollBarWidth';
import useDynamicHeight from './api/useDynamicHeight';
import { currentPosition, maximumPosition } from './entities/position';
import Loading from './Loading';
import { Viewer } from './Viewer';

if (window.location.hostname !== 'tauri.localhost') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

type PdfViewerProps = {
  file: string;
  pos: number;
};

const PdfViewer = React.forwardRef<Viewer, PdfViewerProps>((props: PdfViewerProps, ref) => {
  const { file, pos } = props;
  const pages = useEntity(maximumPosition);
  const listRef = React.useRef<VariableSizeList>(null);
  const {
    estimatedHeight, updateEstimatedHeight, getRowHeight, setRowHeight, scrollTo, scrollToPos,
  } = useDynamicHeight<PDFPageProxy>({
    listRef,
    pos,
    getObjectRowHeight: (pdf) => Math.floor(pdf.height),
    getObjectSize: (pdf) => ({
      width: (pdf.originalWidth * 4) / 3,
      height: (pdf.originalHeight * 4) / 3,
    }),
  });

  React.useImperativeHandle(ref, () => ({
    scrollTo,
  }));

  if (file.length === 0) {
    return null;
  }

  return (
    <AutoResizer onResize={updateEstimatedHeight}>
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
            maximumPosition.set(numPages);
            setTimeout(scrollToPos, 100);
          }}
        >
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
});

export default PdfViewer;
