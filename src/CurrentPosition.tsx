import Chip from '@mui/material/Chip';
import React from 'react';
import { Viewer } from './Viewer';

type CurrentPositionProps = {
  viewerRef: React.RefObject<Viewer>;
};

export default function CurrentPosition(props: CurrentPositionProps) {
  const { viewerRef } = props;
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 250);
    return () => clearInterval(interval);
  }, []);

  return viewerRef.current && viewerRef.current?.maxPos > 0 ? (
    <Chip
      size="small"
      color="secondary"
      variant="outlined"
      label={`${viewerRef.current.currentPos + 1}/${viewerRef.current.maxPos}`}
      sx={{
        position: 'absolute',
        bottom: (thm) => thm.spacing(1),
        right: (thm) => thm.spacing(3),
      }}
    />
  ) : null;
}
