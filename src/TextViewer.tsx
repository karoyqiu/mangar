import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import remove from 'lodash/remove';
import sortedIndex from 'lodash/sortedIndex';
import React from 'react';
import { HotKeys } from 'react-hotkeys';
import AutoResizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import store from 'store';
import useDynamicHeight from './api/useDynamicHeight';
import { currentPosition, maximumPosition } from './entities/position';
import FindBox from './FindBox';
import Loading from './Loading';
import { Viewer } from './Viewer';

const keyMap = {
  FIND: 'ctrl+f',
};

const markText = (text: string, mark: string, enabled: boolean) => {
  if (mark.length === 0 || !enabled) {
    return text;
  }

  const highlight = <mark>{mark}</mark>;
  const splitted: React.ReactNode[] = text.split(mark);

  for (let i = splitted.length - 1; i > 0; i -= 1) {
    splitted.splice(i, 0, highlight);
  }

  return splitted;
};

type TextViewerProps = {
  file: string;
  pos: number;
};

const TextViewer = React.forwardRef<Viewer, TextViewerProps>((props, ref) => {
  const { file, pos } = props;
  const [loading, setLoading] = React.useState(true);
  const [lines, setLines] = React.useState<string[]>([]);
  const [findOpen, setFindOpen] = React.useState(false);
  const [finding, setFinding] = React.useState(false);
  const [findText, setFindText] = React.useState('');
  const [occurance, setOccurance] = React.useState<number[]>([]);
  const [current, setCurrent] = React.useState(0);
  const findHanle = React.useRef(0);
  const findIndex = React.useRef(0);
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

  const handlers = React.useMemo(() => ({
    FIND: (e?: KeyboardEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setFindOpen(true);
    },
  }), []);

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

  const findTo = (index: number) => {
    scrollTo(occurance[index]);
    setCurrent(index);
  };

  const findNext = () => {
    if (current < occurance.length - 1) {
      findTo(current + 1);
    } else {
      findTo(0);
    }
  };

  const findPrevious = () => {
    if (current > 0) {
      findTo(current - 1);
    } else {
      findTo(occurance.length - 1);
    }
  };

  const findAll = (result: number[], text: string, deadline: IdleDeadline) => {
    let index = findIndex.current;

    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && index < lines.length) {
      const line = lines[index];

      if (line.includes(text)) {
        result.push(index);
      }

      index += 1;
    }

    if (index < lines.length) {
      findIndex.current = index;
      findHanle.current = requestIdleCallback(
        (d) => findAll(result, text, d),
        { timeout: 1000 },
      );
    } else {
      findIndex.current = 0;
      findHanle.current = 0;
      setOccurance(result);
      setFinding(false);

      if (result.length > 0) {
        const nearest = sortedIndex(result, currentPosition.get());
        console.log('Nearest', nearest, result[nearest]);
        setCurrent(nearest);
        scrollTo(result[nearest]);
      }
    }
  };

  const find = (text: string) => {
    setFindText(text);

    if (findHanle.current) {
      cancelIdleCallback(findHanle.current);
    }

    if (text.length > 0) {
      setFinding(true);
      setCurrent(0);
      setOccurance([]);

      findIndex.current = 0;
      findHanle.current = requestIdleCallback(
        (deadline) => findAll([], text, deadline),
        { timeout: 1000 },
      );
    }
  };

  const findClose = React.useCallback(() => {
    setFinding(false);
    setFindOpen(false);
  }, []);

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
    <>
      <AutoResizer onResize={updateEstimatedHeight}>
        {({ width, height }) => (
          <HotKeys keyMap={keyMap} handlers={handlers}>
            <VariableSizeList
              ref={listRef}
              width={width}
              height={height}
              itemCount={lines.length}
              itemSize={getRowHeight}
              estimatedItemSize={estimatedHeight}
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
                      {markText(lines[index], findText, findOpen && occurance[current] === index)}
                    </Typography>
                  </Stack>
                );
              }}
            </VariableSizeList>
          </HotKeys>
        )}
      </AutoResizer>
      <FindBox
        open={findOpen}
        finding={finding}
        occurance={occurance.length}
        current={current}
        onClose={findClose}
        onFind={find}
        onNext={findNext}
        onPrevious={findPrevious}
      />
    </>
  );
});

export default TextViewer;
