import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

type FindBoxProps = {
  open: boolean;
  finding: boolean;
  occurance: number;
  current: number;
  onClose: () => void;
  onFind: (text: string) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export default function FindBox(props: FindBoxProps) {
  const {
    open, finding, occurance, current, onClose, onFind, onNext, onPrevious,
  } = props;
  const [text, setText] = React.useState('');
  const debouncedFind = useDebouncedCallback(onFind, 1000);

  return open ? (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        bottom: 0,
        transition: 'opacity 0.25s',
        '&:not(:focus-within)': {
          opacity: 0.5,
        },
      }}
    >
      <TextField
        autoComplete="off"
        autoFocus
        size="small"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          debouncedFind(e.target.value);
        }}
        InputProps={{
          endAdornment: (
            <>
              {finding && (
                <InputAdornment position="end">
                  <CircularProgress size="1em" />
                </InputAdornment>
              )}
              {!finding && text.length > 0 && (
                <InputAdornment position="end">
                  <Typography variant="body2" color="text.disabled" sx={{ userSelect: 'none' }}>
                    {`${current + 1}/${occurance}`}
                  </Typography>
                </InputAdornment>
              )}
              <InputAdornment position="end">
                <ButtonGroup variant="text" size="small">
                  <Button
                    disabled={text.length === 0 || current === 0}
                    onClick={onPrevious}
                  >
                    <KeyboardArrowUpIcon />
                  </Button>
                  <Button
                    disabled={text.length === 0 || current === occurance}
                    onClick={onNext}
                  >
                    <KeyboardArrowDownIcon />
                  </Button>
                  <Button onClick={onClose}><CloseIcon /></Button>
                </ButtonGroup>
              </InputAdornment>
            </>
          ),
        }}
      />
    </Paper>
  ) : null;
}
