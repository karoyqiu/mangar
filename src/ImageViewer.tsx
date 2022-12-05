import Stack from '@mui/material/Stack';

type ImageViewerProps = {
  dir: string;
  images: string[];
};

export default function ImageViewer(props: ImageViewerProps) {
  const { dir, images } = props;

  return (
    <Stack width="100%" alignItems="center">
      {images.map((file) => (
        <img
          key={file}
          src={`https://imgaaa.localhost/${dir}/${file}`}
          alt=""
          width="100%"
          loading="lazy"
        />
      ))}
    </Stack>
  );
}
