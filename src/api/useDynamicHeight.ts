import React from 'react';
import { VariableSizeList } from 'react-window';
import store from 'store';
import imageSize from '../entities/imageSize';
import { RowHeights, Size } from './size';

type UseDynamicHeightProps<T> = {
  ref: React.RefObject<VariableSizeList>;
  pos: number;
  getObjectRowHeight: (obj: T) => number;
  getObjectSize: (obj: T) => Size;
};

const useDynamicHeight = <T>(props: UseDynamicHeightProps<T>) => {
  const {
    ref, pos, getObjectRowHeight, getObjectSize,
  } = props;

  const calcEstimatedHeight = React.useCallback(() => {
    const heights = Object.values(store.get('rowHeights', {}) as RowHeights);

    if (heights.length === 0) {
      return 1;
    }

    const sum = heights.reduce((prev, value) => prev + value, 0);
    return Math.floor(sum / heights.length);
  }, []);

  const [estimatedHeight, setEstimatedHeight] = React.useState(calcEstimatedHeight);
  const updateEstimatedHeight = React.useCallback(() => {
    setEstimatedHeight(calcEstimatedHeight());
  }, []);

  const getRowHeight = React.useCallback((index: number) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    return heights[index] || imageSize.get().height;
  }, []);

  const setRowHeight = React.useCallback((index: number, obj: T) => {
    const heights = store.get('rowHeights', {}) as RowHeights;
    store.set('rowHeights', {
      ...heights,
      [index]: getObjectRowHeight(obj),
    });

    if (imageSize.get().height <= 1) {
      imageSize.set(getObjectSize(obj));

      if (Object.keys(heights).length === 0) {
        setEstimatedHeight(calcEstimatedHeight());
      }
    }

    ref.current?.resetAfterIndex(index);
  }, []);

  const scrollTo = React.useCallback((value: number) => {
    ref.current?.scrollToItem(value, 'start');
    const current = store.get('pos', 0) as number;

    if (current !== value) {
      setTimeout(() => scrollTo(value), 20);
    }
  }, [ref]);

  const scrollToPos = React.useCallback(() => {
    scrollTo(pos);
  }, [ref, pos]);

  return {
    estimatedHeight,
    updateEstimatedHeight,
    getRowHeight,
    setRowHeight,
    scrollTo,
    scrollToPos,
  };
};

export default useDynamicHeight;
