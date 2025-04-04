import React, { useState, useRef } from 'react';
import { useFormulaStore, Tag } from '../store/formulaStore';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { Autocomplete, TextField, Menu, MenuItem, Box, Button } from '@mui/material';
import './FormulaInput.css';

const FormulaInput: React.FC = () => {
  const { formula, tags, setFormula, addTag, removeLastTag, removeTagById, calculate } = useFormulaStore();
  const [inputValue, setInputValue] = useState('');
  const [tagAnchorEl, setTagAnchorEl] = useState<null | HTMLElement>(null);
  const [firstBoxAnchorEl, setFirstBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [secondBoxAnchorEl, setSecondBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [thirdBoxAnchorEl, setThirdBoxAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions = [] } = useAutocomplete(inputValue.split(/[\+\-\*\(\)\^\/]/).pop() || '');

  const firstDropdownOptions = [
    'sales cycle',
    'sales assumptions',
    'sign change(array)',
    'spread(array1, array2)',
    'sqrt(number)',
    'stdev(array)',
  ];

  const secondDropdownOptions = [
    'churn rate',
    'churn ARR',
    'chisk(k)',
    'chauchy(beta,scale)',
    'outbound message sent',
  ];

  const thirdDropdownOptions = [
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
    'inbound'
  ];

  const handleClear = () => {
    useFormulaStore.setState({ formula: '', tags: [] });
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setFormula(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeLastTag();
    } else if (['+', '-', '*', '(', ')', '^', '/'].includes(e.key)) {
      const newInputValue = inputValue + e.key;
      setInputValue(newInputValue);
      addTag({ id: Math.random().toString(36).substr(2, 9), value: e.key, type: 'operand' });
      setFormula(newInputValue);
    }
  };

  const handleAutocompleteSelect = (value: string | null) => {
    if (value) {
      const newTag: Tag = {
        id: Math.random().toString(36).substr(2, 9),
        value,
        type: isNaN(Number(value)) ? 'variable' : 'number',
      };
      addTag(newTag);
      setInputValue('');
    }
  };

  const handleTagMenuOpen = (event: React.MouseEvent<HTMLSpanElement>, tagId: string) => {
    setTagAnchorEl(event.currentTarget);
    setSelectedTagId(tagId);
  };

  const handleTagMenuClose = () => {
    setTagAnchorEl(null);
    setSelectedTagId(null);
  };

  const handleFirstBoxMenuOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setFirstBoxAnchorEl(event.currentTarget);
  };

  const handleFirstBoxMenuClose = () => {
    setFirstBoxAnchorEl(null);
  };

  const handleSecondBoxMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSecondBoxAnchorEl(event.currentTarget);
  };

  const handleSecondBoxMenuClose = () => {
    setSecondBoxAnchorEl(null);
  };

  const handleThirdBoxMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setThirdBoxAnchorEl(event.currentTarget);
  };

  const handleThirdBoxMenuClose = () => {
    setThirdBoxAnchorEl(null);
  };

  const handleOptionSelect = (option: string) => {
    addTag({ id: Math.random().toString(36).substr(2, 9), value: option, type: 'variable' });
    handleFirstBoxMenuClose();
    handleSecondBoxMenuClose();
    handleThirdBoxMenuClose();
  };

  const handleDeleteTag = () => {
    if (selectedTagId) {
      removeTagById(selectedTagId);
      handleTagMenuClose();
    }
  };

  const renderFormula = () => {
    return tags.map((tag) => (
      <Box key={tag.id} component="span" className="tag-container">
        <span className={`tag ${tag.type === 'operand' ? 'operand' : ''}`}>
          {tag.value}
        </span>
        {tag.type !== 'operand' && (
          <span
            className="dropdown-trigger"
            onClick={(e) => handleTagMenuOpen(e, tag.id)}
          >
            ▼
          </span>
        )}
      </Box>
    ));
  };

  return (
    <Box className="formula-input-container">
      <Autocomplete<string, false, false, true>
        freeSolo
        open={suggestions.length > 0}
        options={suggestions}
        inputValue={inputValue}
        onInputChange={(_, value) => setInputValue(value)}
        onChange={(_, value) => handleAutocompleteSelect(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label="Formula Input"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        )}
      />
      <Box className="formula-display" onClick={handleFirstBoxMenuOpen}>
        {renderFormula()}
      </Box>
      <Box sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSecondBoxMenuOpen}
          sx={{ mr: 1 }}
        >
          More Options
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleClear}
          sx={{ mr: 1 }}
        >
          Clear
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleThirdBoxMenuOpen}
        >
          Month Options
        </Button>
      </Box>
      <Box className="result">Result: {calculate()}</Box>
      <Menu
        anchorEl={tagAnchorEl}
        open={Boolean(tagAnchorEl)}
        onClose={handleTagMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleTagMenuClose}>Edit (TBD)</MenuItem>
        <MenuItem onClick={handleDeleteTag}>Delete</MenuItem>
      </Menu>
      <Menu
        anchorEl={firstBoxAnchorEl}
        open={Boolean(firstBoxAnchorEl)}
        onClose={handleFirstBoxMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {firstDropdownOptions.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={secondBoxAnchorEl}
        open={Boolean(secondBoxAnchorEl)}
        onClose={handleSecondBoxMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {secondDropdownOptions.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={thirdBoxAnchorEl}
        open={Boolean(thirdBoxAnchorEl)}
        onClose={handleThirdBoxMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {thirdDropdownOptions.map((option) => (
          <MenuItem key={option} onClick={() => handleOptionSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default FormulaInput;