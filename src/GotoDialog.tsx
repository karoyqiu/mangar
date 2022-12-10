import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import React from 'react';
import { NumberFormatValues, NumericFormat } from 'react-number-format';

type GotoDialogProps = {
  open: boolean;
  onClose: (value?: number) => void;
  maximum?: number;
  current?: number;
};

export default function GotoDialog(props: GotoDialogProps) {
  const {
    open, onClose, maximum, current,
  } = props;
  const [value, setValue] = React.useState(current ?? 1);
  const ref = React.useRef<HTMLInputElement>();

  const isAllowed = React.useCallback((values: NumberFormatValues) => {
    const { floatValue = 0 } = values;
    const max = maximum ?? Number.MAX_SAFE_INTEGER;
    return floatValue >= 1 && floatValue <= max;
  }, [maximum]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => ref.current?.focus(), 20);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>
        Go To Page
      </DialogTitle>
      <DialogContent>
        <NumericFormat
          customInput={TextField}
          inputRef={ref}
          helperText={maximum && `Maximum page is ${maximum}.`}
          autoFocus
          decimalScale={0}
          isAllowed={isAllowed}
          value={value}
          onValueChange={(values) => setValue(values.floatValue ?? 1)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onClose(value)}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
