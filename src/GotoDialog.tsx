import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React from 'react';
import { NumberFormatValues, NumericFormat } from 'react-number-format';
import { useEntity } from 'simpler-state';
import { currentPosition, maximumPosition } from './entities/position';

type GotoDialogProps = {
  open: boolean;
  onClose: (value?: number) => void;
};

export default function GotoDialog(props: GotoDialogProps) {
  const { open, onClose } = props;
  const pos = useEntity(currentPosition);
  const max = useEntity(maximumPosition);
  const [value, setValue] = React.useState(pos + 1);
  const ref = React.useRef<HTMLInputElement>();

  const isAllowed = React.useCallback((values: NumberFormatValues) => {
    const { floatValue = 0 } = values;
    return floatValue >= 1 && floatValue <= max;
  }, [max]);

  React.useEffect(() => {
    if (open) {
      setValue(pos + 1);
      setTimeout(() => ref.current?.focus(), 20);
    }
  }, [open, pos]);

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>
        Go To Page
      </DialogTitle>
      <DialogContent>
        <NumericFormat
          customInput={TextField}
          inputRef={ref}
          helperText={`Maximum page is ${max}.`}
          autoFocus
          autoComplete="off"
          decimalScale={0}
          isAllowed={isAllowed}
          value={value}
          onValueChange={(values) => setValue(values.floatValue ?? 1)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onClose(value - 1);
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onClose(value - 1)}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
