import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Typography, Button, IconButton, Paper, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckIcon from '@mui/icons-material/Check';

const WebcamCapture = ({ onImageCapture, onClose, onError }) => {
  const theme = useTheme();
  const webcamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const handleError = (message) => {
    setErrorMessage(message);
    if (onError && typeof onError === 'function') {
      onError(message);
    }
  };

  const handleUserMediaError = useCallback((error) => {
    console.error('Webcam error:', error);
    let errorMsg = 'Erro ao acessar a câmera: ';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMsg = 'Permissão para acessar a câmera foi negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMsg = 'Nenhuma câmera encontrada. Verifique se seu dispositivo tem uma câmera disponível.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMsg = 'A câmera está em uso por outro aplicativo ou não pode ser acessada.';
    } else if (error.name === 'OverconstrainedError') {
      errorMsg = 'As configurações solicitadas para a câmera não são suportadas pelo seu dispositivo.';
    } else {
      errorMsg += error.message || 'Erro desconhecido';
    }
    
    handleError(errorMsg);
    setIsLoading(false);
  }, []);

  const handleUserMedia = useCallback(() => {
    console.log('Camera accessed successfully');
    setIsCameraReady(true);
    setIsLoading(false);
    setErrorMessage('');
  }, []);

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  const capture = useCallback(() => {
    if (!webcamRef.current) {
      handleError('Câmera não inicializada corretamente');
      return;
    }

    try {
      setIsLoading(true);
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        handleError('Não foi possível capturar a imagem');
        setIsLoading(false);
        return;
      }
      
      // Set the captured image for preview
      setCapturedImage(imageSrc);
      setIsLoading(false);
    } catch (err) {
      console.error('Error capturing image:', err);
      handleError('Erro ao capturar imagem: ' + err.message);
      setIsLoading(false);
    }
  }, [webcamRef]);

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;
    
    setIsLoading(true);
    
    // Convert data URL to Blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        // Create a File object from the Blob
        const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
        console.log('Image captured successfully, file size:', file.size, 'bytes');
        
        // Pass the file to parent component
        onImageCapture(file, capturedImage);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error creating file from blob:', err);
        handleError('Erro ao processar a imagem capturada: ' + err.message);
        setIsLoading(false);
      });
  };

  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        position: 'relative',
        backgroundColor: '#000',
        width: '100%',
        aspectRatio: '4/3',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {isLoading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10
            }}
          >
            <CircularProgress color="primary" size={60} thickness={4} />
            <Typography variant="body1" color="white" sx={{ mt: 2 }}>
              Processando...
            </Typography>
          </Box>
        )}
        
        {capturedImage ? (
          // Show captured image preview
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img 
              src={capturedImage} 
              alt="Imagem capturada" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                padding: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2">
                Verifique a imagem capturada
              </Typography>
            </Box>
          </Box>
        ) : (
          // Show webcam feed
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            mirrored={facingMode === 'user'}
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isCameraReady ? 'block' : 'none'
            }}
          />
        )}
        
        {!isCameraReady && !isLoading && !capturedImage && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 3
          }}>
            <PhotoCameraIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" align="center" gutterBottom color="white">
              Inicializando câmera...
            </Typography>
            {errorMessage ? (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  width: '100%',
                  maxWidth: '90%'
                }}
              >
                {errorMessage}
              </Alert>
            ) : (
              <CircularProgress color="primary" size={40} thickness={4} sx={{ mt: 2 }} />
            )}
          </Box>
        )}
        
        {/* Close button */}
        <IconButton 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
            zIndex: 20
          }}
          onClick={onClose}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        backgroundColor: '#f8f9fa'
      }}>
        {capturedImage ? (
          // Show retake and confirm buttons when image is captured
          <>
            <Button
              color="error"
              onClick={retakePhoto}
              startIcon={<ReplayIcon />}
              disabled={isLoading}
              sx={{ borderRadius: 8 }}
            >
              Tirar Novamente
            </Button>
            
            <Button
              variant="contained"
              color="success"
              onClick={confirmPhoto}
              startIcon={<CheckIcon />}
              disabled={isLoading}
              sx={{ 
                borderRadius: 8,
                px: 3,
                py: 1
              }}
            >
              {isLoading ? 'Processando...' : 'Confirmar Foto'}
            </Button>
          </>
        ) : (
          // Show camera controls when in capture mode
          <>
            <IconButton 
              color="primary"
              onClick={toggleCamera}
              aria-label="alternar câmera"
              disabled={!isCameraReady || isLoading}
            >
              <FlipCameraIosIcon />
            </IconButton>
            
            <Button
              variant="contained"
              color="primary"
              onClick={capture}
              disabled={!isCameraReady || isLoading}
              sx={{ 
                borderRadius: 8,
                px: 3,
                py: 1
              }}
            >
              {isLoading ? 'Processando...' : 'Capturar Foto'}
            </Button>
            
            <IconButton 
              color="error"
              onClick={onClose}
              aria-label="fechar câmera"
              disabled={isLoading}
            >
              <CloseIcon />
            </IconButton>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default WebcamCapture; 