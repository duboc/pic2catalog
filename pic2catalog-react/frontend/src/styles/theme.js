import { createTheme } from '@mui/material/styles';

// Google-inspired Colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Google Blue
      light: '#80b0ff',
      dark: '#0d5bdd',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#EA4335', // Google Red
      light: '#ff7961',
      dark: '#b31412',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#4285F4', // Google Blue
    },
    success: {
      main: '#34A853', // Google Green
    },
    warning: {
      main: '#FBBC05', // Google Yellow
    },
    error: {
      main: '#EA4335', // Google Red
    },
    background: {
      default: '#F9F9F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#202124', // Google dark gray
      secondary: '#5f6368', // Google medium gray
    },
    grey: {
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      500: '#9e9e9e',
      700: '#616161',
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.6rem',
      fontWeight: 500,
      color: '#202124',
      marginBottom: '1.5rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#202124',
      marginBottom: '1rem',
    },
    h3: {
      fontSize: '1.4rem',
      fontWeight: 500,
      color: '#202124',
      marginBottom: '0.75rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none', // Google buttons don't use uppercase
          letterSpacing: '0.01rem',
          boxShadow: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
          transition: 'all 0.2s',
          fontSize: '0.9rem',
          padding: '0.6rem 1.5rem',
          fontWeight: 500,
          '&:hover': {
            boxShadow: '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px rgba(60,64,67,0.15)',
            backgroundColor: '#4285F4',
          },
        },
        containedPrimary: {
          backgroundColor: '#4285F4',
          '&:hover': {
            backgroundColor: '#1a73e8',
          },
        },
        containedSecondary: {
          backgroundColor: '#EA4335',
          '&:hover': {
            backgroundColor: '#d93025',
          },
        },
        outlined: {
          borderColor: '#dadce0',
          '&:hover': {
            borderColor: '#d2e3fc',
            backgroundColor: 'rgba(66, 133, 244, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '1.5rem',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
          marginBottom: '1.5rem',
          border: 'none',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
        },
      },
    },
  },
});

export default theme; 