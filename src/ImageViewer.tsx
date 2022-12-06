import React from 'react';
import { Virtuoso } from 'react-virtuoso';

type ImageViewerProps = {
  dir: string;
  images: string[];
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images } = props;

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
      overscan={1024}
    />
  );
}
