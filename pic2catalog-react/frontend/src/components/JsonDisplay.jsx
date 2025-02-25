import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const JsonDisplay = ({ data, title }) => {
  if (!data) return null;
  
  return (
    <Box sx={{ mb: 4 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          p: 2, 
          bgcolor: '#f8f9fa',
          borderRadius: 2,
          fontFamily: '"Roboto Mono", monospace',
          overflow: 'auto',
          maxHeight: '500px'
        }}
      >
        <pre style={{ margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default JsonDisplay; 