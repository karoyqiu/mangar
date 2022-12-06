import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useEntity } from 'simpler-state';
import windowHeight from './entities/windowHeight';

type ImageViewerProps = {
  dir: string;
  images: string[];
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images } = props;
  const wHeight = useEntity(windowHeight);

  const renderImage = React.useCallback((index: number) => (
    <img
      src={`https://imgaaa.localhost/${dir}/${images[index]}`}
      alt=""
      width="100%"
    />
  ), [dir, images]);

  return (
    <Virtuoso
      width="100%"
      totalCount={images.length}
      itemContent={renderImage}
      overscan={wHeight * 2}
    />
  );
}
