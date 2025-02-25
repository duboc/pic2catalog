import React from 'react';
import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dadce0',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Pic2Catalog
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerador de catálogo de produtos com IA que utiliza o Google Gemini para analisar imagens e criar descrições detalhadas.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'center' } }}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom>
              Links Úteis
            </Typography>
            <Link href="https://ai.google.dev/docs" target="_blank" color="primary" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Documentação Gemini API
            </Link>
            <Link href="https://cloud.google.com/vertex-ai" target="_blank" color="primary" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Google Vertex AI
            </Link>
            <Link href="https://github.com/google/generative-ai-docs" target="_blank" color="primary" sx={{ fontSize: '0.875rem' }}>
              Exemplos de Código
            </Link>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'rgba(66, 133, 244, 0.08)',
              }}
            >
              <Typography variant="body2" color="primary.main">
                Powered by Google Gemini
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Desenvolvido com FastAPI e React
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          © {year} Pic2Catalog - Todos os direitos reservados
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 