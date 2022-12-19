import { Typography, useTheme } from '@mui/material';
import Stack from '@mui/material/Stack';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import remove from 'lodash/remove';
import React from 'react';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import useDynamicHeight from './api/useDynamicHeight';
import { currentPosition, maximumPosition } from './entities/position';
import Loading from './Loading';
import { Viewer } from './Viewer';

type TextViewerProps = {
  file: string;
  pos: number;
};

const TextViewer = React.forwardRef<Viewer, TextViewerProps>((props, ref) => {
  const { file, pos } = props;
  const [loading, setLoading] = React.useState(true);
  const [lines, setLines] = React.useState<string[]>([]);
  const listRef = React.useRef<VariableSizeList>(null);
  const theme = useTheme();
  const {
    estimatedHeight, updateEstimatedHeight, getRowHeight, setRowHeight, scrollTo, scrollToPos,
  } = useDynamicHeight<HTMLSpanElement>({
    listRef,
    pos,
    getObjectRowHeight: (p) => Math.floor(p.clientHeight + 24),
    getObjectSize: (p) => ({
      width: theme.breakpoints.values.sm,
      height: p.clientHeight,
    }),
  });

  const loadFile = React.useCallback(async (f: string) => {
    if (f.length === 0) {
      return;
    }

    setLoading(true);

    // Load file
    const url = convertFileSrc(f);
    const resp = await fetch(url);
    const text = await resp.text();
    const splitted = text.split('\n');
    splitted.forEach((s, index) => {
      splitted[index] = s.trim();
    });
    remove(splitted, (s) => s.length === 0);

    maximumPosition.set(splitted.length);
    setLines(splitted);
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
          itemCount={lines.length}
          itemSize={getRowHeight}
          estimatedItemSize={estimatedHeight}
          overscanCount={2}
          onItemsRendered={({ visibleStartIndex }) => {
            if (lines.length > 0) {
              currentPosition.set(visibleStartIndex);
              store.set('pos', visibleStartIndex);
            }
          }}
        >
          {({ index, style }) => {
            const rowRef = React.useRef<HTMLSpanElement>(null);

            React.useEffect(() => {
              if (rowRef.current) {
                setRowHeight(index, rowRef.current);
              }
            }, [rowRef]);

            return (
              <Stack style={style} alignItems="center">
                <Typography
                  ref={rowRef}
                  align="justify"
                  color="#bbb"
                  width={theme.breakpoints.values.sm}
                  lineHeight={2}
                  sx={{
                    textIndent: '2em',
                    textRendering: 'optimizeLegibility',
                    userSelect: 'none',
                  }}
                >
                  {lines[index]}
                </Typography>
              </Stack>
            );
          }}
        </VariableSizeList>
      )}
    </AutoResizer>
  );
});

export default TextViewer;
