import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Alert, Tabs, Tab, Paper, Button, Divider, ButtonGroup, Snackbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FileUpload from '../components/FileUpload';
import WebcamCapture from '../components/WebcamCapture';
import ProductDisplay from '../components/ProductDisplay';
import JsonDisplay from '../components/JsonDisplay';
import { generateCatalog } from '../services/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Home = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputMethod, setInputMethod] = useState('upload'); // 'upload' or 'camera'
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [cameraKey, setCameraKey] = useState(0); // Used to force remount of camera component

  // Check if camera is supported on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera API not supported in this browser');
        setIsCameraSupported(false);
        return;
      }

      try {
        // Try to get camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop all tracks immediately
        stream.getTracks().forEach(track => track.stop());
        setIsCameraSupported(true);
      } catch (err) {
        console.warn('Camera access check failed:', err);
        // We'll still show the camera option, but it might not work
        // The WebcamCapture component will handle the specific error
      }
    };

    checkCameraSupport();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setNotification({
        open: true,
        message: 'Imagem selecionada com sucesso!',
        severity: 'success'
      });
    }
  };

  const handleImageCapture = (file, imageDataUrl) => {
    if (file) {
      setSelectedFile(file);
      setImagePreview(imageDataUrl);
      setInputMethod('upload'); // Switch back to upload view after capture
      setNotification({
        open: true,
        message: 'Imagem capturada com sucesso!',
        severity: 'success'
      });
    }
  };

  const handleCameraError = (errorMessage) => {
    console.error('Camera error:', errorMessage);
    setNotification({
      open: true,
      message: 'Erro na câmera: ' + errorMessage,
      severity: 'error'
    });
  };

  const handleRetryCameraCapture = () => {
    // Force remount of camera component by changing its key
    setCameraKey(prevKey => prevKey + 1);
    setNotification({
      open: true,
      message: 'Tentando reiniciar a câmera...',
      severity: 'info'
    });
  };

  const handleGenerateCatalog = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await generateCatalog(selectedFile);
      setProductData(data);
      setTabValue(1); // Switch to product view tab
    } catch (err) {
      console.error('Error generating catalog:', err);
      setError(err.response?.data?.detail || 'Erro ao gerar o catálogo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!productData) return;
    
    const dataStr = JSON.stringify(productData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'catalogo_produto.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({
      open: true,
      message: 'JSON baixado com sucesso!',
      severity: 'success'
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 500, 
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 32 }} /> Pic2Catalog
        </Typography>
        <Typography 
          variant="h5" 
          component="h2" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontWeight: 400 }}
        >
          Gerador de Catálogo de Produtos com IA
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            maxWidth: 700, 
            mx: 'auto',
            mb: 2
          }}
        >
          Faça upload de uma imagem do produto e deixe a IA gerar uma entrada completa de catálogo para sua loja online!
        </Typography>
        <Box 
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            bgcolor: 'rgba(66, 133, 244, 0.08)', 
            px: 2, 
            py: 1, 
            borderRadius: 2,
            border: '1px solid rgba(66, 133, 244, 0.2)'
          }}
        >
          <Typography variant="body2" color="primary.main">
            Powered by Google Gemini
          </Typography>
        </Box>
      </Box>

      <Paper 
        sx={{ 
          mb: 4, 
          overflow: 'hidden',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="application tabs"
          centered
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: '#f8f9fa'
          }}
        >
          <Tab 
            label="Gerador de Catálogo" 
            id="tab-0" 
            sx={{ py: 2 }}
          />
          <Tab 
            label="Visualização do Produto" 
            id="tab-1" 
            disabled={!productData} 
            sx={{ py: 2 }}
          />
          <Tab 
            label="JSON" 
            id="tab-2" 
            disabled={!productData} 
            sx={{ py: 2 }}
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ mb: 3 }}>
              Selecione ou capture uma imagem do produto
            </Typography>
            
            {/* Input method selection */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <ButtonGroup variant="outlined" aria-label="método de entrada de imagem">
                <Button 
                  onClick={() => setInputMethod('upload')}
                  variant={inputMethod === 'upload' ? 'contained' : 'outlined'}
                  startIcon={<UploadFileIcon />}
                  sx={{ px: 3 }}
                >
                  Upload
                </Button>
                <Button 
                  onClick={() => setInputMethod('camera')}
                  variant={inputMethod === 'camera' ? 'contained' : 'outlined'}
                  startIcon={<PhotoCameraIcon />}
                  sx={{ px: 3 }}
                  disabled={!isCameraSupported}
                >
                  Câmera
                </Button>
              </ButtonGroup>
            </Box>
            
            {!isCameraSupported && inputMethod === 'camera' && (
              <Alert 
                severity="warning" 
                sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
              >
                Seu navegador não suporta acesso à câmera. Por favor, use a opção de upload.
              </Alert>
            )}
            
            {/* Show either file upload or camera capture based on selected method */}
            {inputMethod === 'upload' || !isCameraSupported ? (
              <FileUpload 
                onFileSelect={handleFileSelect} 
                isLoading={loading} 
              />
            ) : (
              <Box sx={{ position: 'relative' }}>
                <WebcamCapture 
                  key={cameraKey}
                  onImageCapture={handleImageCapture}
                  onClose={() => setInputMethod('upload')}
                  onError={handleCameraError}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleRetryCameraCapture}
                    sx={{ mt: 1 }}
                  >
                    Reiniciar Câmera
                  </Button>
                </Box>
              </Box>
            )}
            
            {selectedFile && !loading && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={handleGenerateCatalog}
                  sx={{ 
                    minWidth: 220,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  Gerar Catálogo
                </Button>
              </Box>
            )}
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3,
                  borderRadius: 2
                }}
              >
                {error}
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {productData && (
            <ProductDisplay 
              productInfo={productData.catalog_info} 
              reviewsInfo={productData.reviews_info}
              imageUrl={imagePreview}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {productData && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleDownloadJson}
                  startIcon={<DownloadIcon />}
                >
                  Baixar JSON
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <JsonDisplay 
                data={productData.catalog_info} 
                title="Informações do Catálogo" 
              />
              <JsonDisplay 
                data={productData.reviews_info} 
                title="Avaliações e Resumo" 
              />
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home; 