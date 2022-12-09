import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Loading() {
  return (
    <Stack
      spacing={2}
      width="100vw"
      height="100vh"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress />
      <Typography>
        Loading...
      </Typography>
    </Stack>
  );
}
