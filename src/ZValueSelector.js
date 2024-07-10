import React from 'react';
import { Autocomplete, TextField } from '@mui/material';

const ZValueSelector = ({ zOptions, selectedZ, handleChange, multiple }) => {
  return (
    <Autocomplete
      multiple={multiple}
      options={zOptions}
      value={selectedZ}
      onChange={(event, newValue) => handleChange(event, newValue)}
      renderInput={(params) => <TextField {...params} label="Select Parameter" variant="outlined" />}
      getOptionLabel={(option) => option}
      renderOption={(props, option) => (
        <li {...props} key={option}>
          {option}
        </li>
      )}
    />
  );
};

export default ZValueSelector;