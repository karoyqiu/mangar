import Stack from '@mui/material/Stack';

type ImageViewerProps = {
  images: string[];
};

export default function ImageViewer(props: ImageViewerProps) {
  const { images } = props;

  return (
    <Stack width="100%" alignItems="center">
      {images.map((file) => (
        <img
          src={`data:image/jpeg;base64,${file}`}
          alt=""
          width="100%"
        />
      ))}
    </Stack>
  );
}
