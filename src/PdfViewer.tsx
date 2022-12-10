import { convertFileSrc } from '@tauri-apps/api/tauri';
import React from 'react';
import { PDFPageProxy } from 'react-pdf';
import { Document, Page, pdfjs } from 'react-pdf/dist/esm/entry.vite';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import scrollBarWidth from './api/scrollBarWidth';
import useDynamicHeight from './api/useDynamicHeight';
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
  const [pages, setPages] = React.useState(0);
  const [currentPos, setCurrentPos] = React.useState(0);
  const listRef = React.useRef<VariableSizeList>(null);
  const {
    estimatedHeight, updateEstimatedHeight, getRowHeight, setRowHeight, scrollTo, scrollToPos,
  } = useDynamicHeight<PDFPageProxy>({
    ref: listRef,
    pos,
    getObjectRowHeight: (pdf) => Math.floor(pdf.height),
    getObjectSize: (pdf) => ({
      width: (pdf.originalWidth * 4) / 3,
      height: (pdf.originalHeight * 4) / 3,
    }),
  });

  React.useImperativeHandle(ref, () => ({
    currentPos,
    maxPos: pages,
    scrollTo,
  }));

  React.useEffect(() => {
    if (pages > 0) {
      setTimeout(scrollToPos, 100);
    }
  }, [pages, pos]);

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
            setPages(numPages);
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
            onItemsRendered={({ visibleStartIndex }) => {
              if (pages > 0) {
                setCurrentPos(visibleStartIndex);
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
