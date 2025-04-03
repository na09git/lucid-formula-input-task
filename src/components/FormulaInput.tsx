import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useFormulaStore, Tag } from '../store/formulaStore';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { Autocomplete, TextField, Menu, MenuItem, Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDebounce } from 'use-debounce'; // Add this dependency
import './FormulaInput.css';

interface FormulaTag extends Tag {
  id: string;
  value: string;
  type: 'operand' | 'variable' | 'number';
}

interface FormulaInputError {
  message: string;
  type: 'input' | 'calculation';
}

const FormulaContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  maxWidth: '600px',
  margin: '0 auto',
  width: '100%',
}));

const FormulaDisplay = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.grey[300]}`,
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  cursor: 'pointer',
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

const ResultDisplay = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const FormulaInput: React.FC = () => {
  const { formula, tags, setFormula, addTag, removeLastTag, removeTagById, calculate } = useFormulaStore();
  const [inputValue, setInputValue] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [tagAnchorEl, setTagAnchorEl] = useState<null | HTMLElement>(null);
  const [firstBoxAnchorEl, setFirstBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [secondBoxAnchorEl, setSecondBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [thirdBoxAnchorEl, setThirdBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [error, setError] = useState<FormulaInputError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentSegment = useCallback((): string => {
    if (!inputValue || cursorPosition === 0) return '';
    
    const operators = /[\+\-\*\(\)\^\/]/;
    let start = cursorPosition - 1;
    let end = cursorPosition;

    while (start >= 0 && !operators.test(inputValue[start])) {
      start--;
    }
    start++;

    while (end < inputValue.length && !operators.test(inputValue[end])) {
      end++;
    }

    return inputValue.substring(start, end).trim();
  }, [inputValue, cursorPosition]);

  const [debouncedSegment] = useDebounce(getCurrentSegment(), 300); // Debounce suggestions
  const { data: suggestions = [], isLoading } = useAutocomplete(debouncedSegment);

  const dropdownOptions = useMemo(() => ({
    first: [
      'sales cycle',
      'sales assumptions',
      'sign change(array)',
      'spread(array1, array2)',
      'sqrt(number)',
      'stdev(array)',
    ],
    second: [
      'churn rate',
      'churn ARR',
      'chisk(k)',
      'chauchy(beta,scale)',
      'outbound message sent',
    ],
    third: [
      'month (dividen, devisor)',
      'month',
      'month_from_date(date)',
      'contact length (month)',
      'sales cycle month',
      'demos',
      'meeting ->demos',
      'inbound lead to meeting booked',
      'inbound lead growth',
      'inbound leads',
      'inbound leads initial',
      'inbound meeting booked',
      'inbound',
    ],
  }), []);

  const handleClear = useCallback(() => {
    useFormulaStore.setState({ formula: '', tags: [] });
    setInputValue('');
    setCursorPosition(0);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 1000) {
      setError({ message: 'Formula too long', type: 'input' });
      return;
    }
    setInputValue(value);
    setFormula(value);
    setCursorPosition(e.target.selectionStart || 0);
    setError(null);
  }, [setFormula]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeLastTag();
    } else if (['+', '-', '*', '(', ')', '^', '/'].includes(e.key)) {
      const newInputValue = inputValue + e.key;
      setInputValue(newInputValue);
      addTag({ id: crypto.randomUUID(), value: e.key, type: 'operand' });
      setFormula(newInputValue);
      setCursorPosition(cursorPosition + 1);
    }
  }, [inputValue, tags.length, cursorPosition, addTag, removeLastTag, setFormula]);

  const handleAutocompleteSelect = useCallback((value: string | null) => {
    if (!value) return;
    
    try {
      const currentSegment = getCurrentSegment();
      const newValue = 
        inputValue.substring(0, cursorPosition - currentSegment.length) +
        value +
        inputValue.substring(cursorPosition);
      
      setInputValue(newValue);
      setFormula(newValue);
      const newCursorPosition = cursorPosition - currentSegment.length + value.length;
      setCursorPosition(newCursorPosition);

      const newTag: FormulaTag = {
        id: crypto.randomUUID(),
        value,
        type: isNaN(Number(value)) ? 'variable' : 'number',
      };
      addTag(newTag);

      // Restore focus and cursor position
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    } catch (err) {
      setError({ message: 'Error processing selection', type: 'input' });
    }
  }, [inputValue, cursorPosition, getCurrentSegment, addTag, setFormula]);

  const handleTagMenuOpen = useCallback((event: React.MouseEvent<HTMLSpanElement>, tagId: string) => {
    setTagAnchorEl(event.currentTarget);
    setSelectedTagId(tagId);
  }, []);

  const handleMenuClose = useCallback((type: 'tag' | 'first' | 'second' | 'third') => {
    switch (type) {
      case 'tag':
        setTagAnchorEl(null);
        setSelectedTagId(null);
        break;
      case 'first':
        setFirstBoxAnchorEl(null);
        break;
      case 'second':
        setSecondBoxAnchorEl(null);
        break;
      case 'third':
        setThirdBoxAnchorEl(null);
        break;
    }
    inputRef.current?.focus();
  }, []);

  const handleOptionSelect = useCallback((option: string) => {
    try {
      const newValue = inputValue.substring(0, cursorPosition) + option + inputValue.substring(cursorPosition);
      setInputValue(newValue);
      setFormula(newValue);
      const newCursorPosition = cursorPosition + option.length;
      setCursorPosition(newCursorPosition);
      
      addTag({ id: crypto.randomUUID(), value: option, type: 'variable' });
      handleMenuClose('first');
      handleMenuClose('second');
      handleMenuClose('third');

      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    } catch (err) {
      setError({ message: 'Error adding option', type: 'input' });
    }
  }, [inputValue, cursorPosition, addTag, setFormula, handleMenuClose]);

  const handleDeleteTag = useCallback(() => {
    if (selectedTagId) {
      removeTagById(selectedTagId);
      handleMenuClose('tag');
    }
  }, [selectedTagId, removeTagById, handleMenuClose]);

  const renderFormula = useMemo(() => {
    return tags.map((tag: FormulaTag) => (
      <Box key={tag.id} component="span" className="tag-container">
        <span className={`tag ${tag.type === 'operand' ? 'operand' : ''}`}>
          {tag.value}
        </span>
        {tag.type !== 'operand' && (
          <span
            className="dropdown-trigger"
            onClick={(e) => handleTagMenuOpen(e, tag.id)}
            aria-label={`Options for ${tag.value}`}
          >
            ▼
          </span>
        )}
      </Box>
    ));
  }, [tags, handleTagMenuOpen]);

  const calculatedResult = useMemo(() => {
    try {
      return calculate();
    } catch (err) {
      setError({ message: 'Calculation error', type: 'calculation' });
      return 'Error';
    }
  }, [calculate]);

  return (
    <FormulaContainer className="formula-input-container">
      <Autocomplete<string, false, false, true>
        freeSolo
        options={suggestions}
        inputValue={inputValue}
        disabled={isLoading}
        onChange={(_, value) => handleAutocompleteSelect(value)}
        openOnFocus // Keep dropdown open when focused
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label="Formula Input"
            variant="outlined"
            error={!!error}
            helperText={error?.message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={(e: React.SyntheticEvent<HTMLInputElement>) => {
              setCursorPosition(e.currentTarget.selectionStart || 0);
            }}
            aria-label="Formula input field"
            inputProps={{
              ...params.inputProps,
              autoComplete: 'off', // Prevent browser autocomplete
            }}
          />
        )}
      />
      <FormulaDisplay 
        tabIndex={0}
        onClick={(e) => setFirstBoxAnchorEl(e.currentTarget)}
      >
        {renderFormula}
      </FormulaDisplay>
      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setSecondBoxAnchorEl(e.currentTarget)}
        >
          More Options
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleClear}
          color="secondary"
        >
          Clear
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setThirdBoxAnchorEl(e.currentTarget)}
        >
          Month Options
        </Button>
      </Box>
      <ResultDisplay>
        Result: {calculatedResult}
      </ResultDisplay>
      <Menu
        anchorEl={tagAnchorEl}
        open={Boolean(tagAnchorEl)}
        onClose={() => handleMenuClose('tag')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled>Edit (Coming Soon)</MenuItem>
        <MenuItem onClick={handleDeleteTag}>Delete</MenuItem>
      </Menu>
      <Menu
        anchorEl={firstBoxAnchorEl}
        open={Boolean(firstBoxAnchorEl)}
        onClose={() => handleMenuClose('first')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {dropdownOptions.first.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={secondBoxAnchorEl}
        open={Boolean(secondBoxAnchorEl)}
        onClose={() => handleMenuClose('second')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {dropdownOptions.second.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={thirdBoxAnchorEl}
        open={Boolean(thirdBoxAnchorEl)}
        onClose={() => handleMenuClose('third')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {dropdownOptions.third.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </FormulaContainer>
  );
};

export default FormulaInput;