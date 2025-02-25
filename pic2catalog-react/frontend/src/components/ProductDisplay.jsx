import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Rating
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProductDisplay = ({ productInfo, reviewsInfo, imageUrl }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!productInfo) return null;

  // Calculate average rating
  const reviews = reviewsInfo?.reviews || [];
  const avgRating = reviews.length 
    ? reviews.reduce((acc, review) => acc + review.estrelas, 0) / reviews.length 
    : 0;

  return (
    <Box sx={{ mb: 6 }}>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Home
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
          &gt;
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {productInfo['Categoria']}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
          &gt;
        </Typography>
        <Typography variant="body2" color="primary">
          {productInfo['Nome do Produto']}
        </Typography>
      </Box>

      {/* Product Header */}
      <Box className="product-header">
        <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 1 }}>
          {productInfo['Nome do Produto']}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
          {productInfo['Marca'] || 'Marca não especificada'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Rating value={avgRating} precision={0.5} readOnly />
          <Typography variant="body2" sx={{ color: 'white', ml: 1 }}>
            {avgRating.toFixed(1)} ({reviews.length} avaliações)
          </Typography>
        </Box>
      </Box>

      {/* Main Product Content */}
      <Grid container spacing={4}>
        {/* Left Column - Image and Price */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3, position: 'relative' }}>
            <Box sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              bgcolor: theme.palette.secondary.main,
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 'bold',
              zIndex: 1
            }}>
              NOVO
            </Box>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt={productInfo['Nome do Produto']} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 400, 
                    objectFit: 'contain' 
                  }} 
                />
              )}
            </Box>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preço sugerido:
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={theme.palette.secondary.main}
                sx={{ fontWeight: 'bold', mb: 3 }}
              >
                {productInfo['Faixa de Preço Sugerida']}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <i className="fas fa-truck" style={{ marginRight: 8, color: theme.palette.primary.main }}></i>
                  Frete Grátis para todo o Brasil
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <i className="fas fa-sync" style={{ marginRight: 8, color: theme.palette.primary.main }}></i>
                  Devolução gratuita em até 30 dias
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-shield-alt" style={{ marginRight: 8, color: theme.palette.primary.main }}></i>
                  Garantia de 12 meses
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Product Details */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="product tabs"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="Descrição" id="product-tab-0" />
                <Tab label="Especificações" id="product-tab-1" />
                <Tab label="Avaliações" id="product-tab-2" />
              </Tabs>
            </Box>

            {/* Description Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" component="h3" className="section-header">
                Sobre este produto
              </Typography>
              <Typography variant="body1" paragraph>
                {productInfo['Descrição Longa']}
              </Typography>

              <Typography variant="h6" component="h3" sx={{ color: theme.palette.primary.main, mt: 4, mb: 2 }}>
                ✨ Características Principais
              </Typography>
              <Box className="feature-list">
                {productInfo['Características Principais']?.map((feature, index) => (
                  <Box key={index} className="feature-item">
                    <Box className="feature-icon">•</Box>
                    <Typography variant="body1">{feature}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="h6" component="h3" sx={{ color: theme.palette.primary.main, mt: 4, mb: 2 }}>
                🎯 Público-Alvo
              </Typography>
              <Typography variant="body1">
                {productInfo['Público-Alvo']}
              </Typography>

              <Typography variant="h6" component="h3" sx={{ color: theme.palette.primary.main, mt: 4, mb: 2 }}>
                🏷️ Tags de Produto
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {productInfo['Tags de Busca']?.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    sx={{ 
                      mr: 1, 
                      mb: 1, 
                      bgcolor: '#e3f2fd', 
                      color: '#0277bd' 
                    }} 
                  />
                ))}
              </Box>
            </TabPanel>

            {/* Specifications Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" component="h3" className="section-header">
                Especificações Técnicas
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                  <TableBody>
                    {productInfo['Especificações Técnicas'] && Object.entries(productInfo['Especificações Técnicas']).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell 
                          component="th" 
                          scope="row"
                          sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.primary.main,
                            width: '40%'
                          }}
                        >
                          {key}
                        </TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" component="h3" className="section-header">
                📏 Dimensões e Peso
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                  <TableBody>
                    {productInfo['Dimensões'] && Object.entries(productInfo['Dimensões']).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell 
                          component="th" 
                          scope="row"
                          sx={{ 
                            fontWeight: 500, 
                            color: theme.palette.primary.main,
                            width: '40%'
                          }}
                        >
                          {key}
                        </TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" component="h3" className="section-header">
                🎨 Cores Disponíveis
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {productInfo['Opções de Cores']?.map((color, index) => {
                  // Map color names to hex values
                  const colorMap = {
                    'Preto': '#000000', 'Branco': '#FFFFFF', 'Vermelho': '#ff3b30', 
                    'Azul': '#007aff', 'Verde': '#34c759', 'Amarelo': '#ffcc00', 
                    'Laranja': '#ff9500', 'Roxo': '#af52de', 'Rosa': '#ff2d55', 
                    'Cinza': '#8e8e93', 'Marrom': '#a2845e', 'Dourado': '#d4af37',
                    'Prata': '#c0c0c0', 'Bege': '#f5f5dc', 'Turquesa': '#40e0d0'
                  };
                  const colorHex = colorMap[color] || '#cccccc';
                  
                  return (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 30, 
                          height: 30, 
                          borderRadius: '50%', 
                          bgcolor: colorHex,
                          border: '2px solid #e0e0e0',
                          mb: 0.5,
                          mx: 'auto'
                        }} 
                      />
                      <Typography variant="body2">{color}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </TabPanel>

            {/* Reviews Tab */}
            <TabPanel value={tabValue} index={2}>
              {reviewsInfo ? (
                <>
                  <Box sx={{ 
                    bgcolor: '#f5f7fa', 
                    borderRadius: 2, 
                    p: 3, 
                    mb: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="h6" align="center" gutterBottom sx={{ color: theme.palette.primary.dark, fontWeight: 600 }}>
                      O que os Clientes estão dizendo
                    </Typography>
                    
                    <Box sx={{ 
                      bgcolor: 'white', 
                      borderRadius: 1, 
                      p: 2,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                    }}>
                      <Box sx={{ display: 'flex', mb: 3 }}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          pr: 3, 
                          borderRight: `1px solid ${theme.palette.grey[300]}`,
                          mr: 3
                        }}>
                          <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {avgRating.toFixed(1)}
                          </Typography>
                          <Rating value={avgRating} precision={0.5} readOnly />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {reviews.length} avaliações
                          </Typography>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                            Destaques
                          </Typography>
                          
                          {reviewsInfo.summary?.pontos_fortes?.map((point, index) => (
                            <Box key={index} className="feature-item">
                              <Box sx={{ color: theme.palette.success.main, mr: 1 }}>✓</Box>
                              <Typography variant="body2">{point}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                        Sentimento Geral
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {reviewsInfo.summary?.sentimento_geral}
                      </Typography>
                      
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                        Recomendações
                      </Typography>
                      <Typography variant="body2">
                        {reviewsInfo.summary?.recomendacoes}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" className="section-header">
                    Avaliações de Clientes
                  </Typography>
                  
                  {reviews.map((review, index) => (
                    <Box key={index} className="review-card">
                      <Box className="review-header">
                        <Typography variant="subtitle1" className="review-title">
                          {review.titulo}
                        </Typography>
                        <Rating value={review.estrelas} readOnly size="small" />
                      </Box>
                      
                      <Typography variant="body2" className="review-meta">
                        por {review.nome} • {review.data}
                      </Typography>
                      
                      <Typography variant="body1" className="review-content">
                        {review.texto}
                      </Typography>
                      
                      {(review.pros?.length > 0 || review.contras?.length > 0) && (
                        <Box className="review-pros-cons">
                          {review.pros?.length > 0 && (
                            <Box className="review-pros">
                              <Typography variant="subtitle2" className="review-pros-title">
                                Prós
                              </Typography>
                              {review.pros.map((pro, idx) => (
                                <Box key={idx} className="feature-item">
                                  <Box sx={{ color: theme.palette.success.main, mr: 1 }}>✓</Box>
                                  <Typography variant="body2">{pro}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                          
                          {review.contras?.length > 0 && (
                            <Box className="review-cons">
                              <Typography variant="subtitle2" className="review-cons-title">
                                Contras
                              </Typography>
                              {review.contras.map((contra, idx) => (
                                <Box key={idx} className="feature-item">
                                  <Box sx={{ color: theme.palette.error.main, mr: 1 }}>×</Box>
                                  <Typography variant="body2">{contra}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Nenhuma avaliação disponível para este produto.
                </Typography>
              )}
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductDisplay; 