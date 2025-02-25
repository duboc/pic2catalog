import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const Header = () => {
  const theme = useTheme();
  
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #dadce0',
        marginBottom: 4
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesomeIcon 
              sx={{ 
                fontSize: 28, 
                mr: 1.5, 
                color: theme.palette.primary.main 
              }} 
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 500,
                color: theme.palette.primary.main,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Pic2Catalog
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                mr: 2,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Powered by Google Gemini
            </Typography>
            <Box 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: 'white',
                py: 0.7,
                px: 1.5,
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Gerador de Catálogo
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 