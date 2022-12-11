import Chip from '@mui/material/Chip';
import { useEntity } from 'simpler-state';
import { currentPosition, maximumPosition } from './entities/position';

export default function CurrentPosition() {
  const pos = useEntity(currentPosition);
  const max = useEntity(maximumPosition);

  return max > 0 ? (
    <Chip
      size="small"
      color="secondary"
      variant="outlined"
      label={`${pos + 1}/${max}`}
      sx={{
        position: 'absolute',
        bottom: (thm) => thm.spacing(1),
        right: (thm) => thm.spacing(3),
      }}
    />
  ) : null;
}
