import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Paper, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import CloseIcon from '@mui/icons-material/Close';

const CameraCapture = ({ onImageCapture, onClose, onError }) => {
  const theme = useTheme();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Check if the browser supports getUserMedia
  const hasGetUserMedia = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  useEffect(() => {
    // Set mounted flag
    setIsMounted(true);
    
    // Clean up function to stop the camera when component unmounts
    return () => {
      setIsMounted(false);
      stopCamera();
    };
  }, []);

  const handleError = (message) => {
    if (!isMounted) return;
    
    setErrorMessage(message);
    if (onError && typeof onError === 'function') {
      onError(message);
    }
  };

  const startCamera = async () => {
    if (!isMounted) return;
    
    if (!hasGetUserMedia()) {
      const errorMsg = 'Seu navegador não suporta acesso à câmera. Por favor, tente em um navegador mais recente.';
      handleError(errorMsg);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Stop any existing stream
      stopCamera();
      
      // Wait a moment to ensure DOM is updated and ref is available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if component is still mounted
      if (!isMounted) {
        console.log('Component unmounted during camera initialization');
        return;
      }
      
      // Double check videoRef before proceeding
      if (!videoRef.current) {
        console.error('Video ref is null before camera initialization');
        handleError('Erro interno: elemento de vídeo não encontrado. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Try with simpler constraints first
      const constraints = {
        video: { facingMode },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if component is still mounted after async operation
        if (!isMounted) {
          console.log('Component unmounted after getUserMedia');
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log('Camera stream obtained:', mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          // Add event listener to handle when video is ready
          videoRef.current.onloadedmetadata = () => {
            // Check if component is still mounted
            if (!isMounted) {
              console.log('Component unmounted during video metadata loading');
              return;
            }
            
            console.log('Video metadata loaded, playing video');
            videoRef.current.play()
              .then(() => {
                // Check if component is still mounted
                if (!isMounted) return;
                
                console.log('Video playback started successfully');
                setIsCameraActive(true);
                setStream(mediaStream);
                setIsLoading(false);
              })
              .catch(err => {
                // Check if component is still mounted
                if (!isMounted) return;
                
                console.error('Error starting video playback:', err);
                const errorMsg = 'Erro ao iniciar a reprodução de vídeo: ' + err.message;
                handleError(errorMsg);
                setIsLoading(false);
              });
          };
          
          // Add error handler for video element
          videoRef.current.onerror = (err) => {
            // Check if component is still mounted
            if (!isMounted) return;
            
            console.error('Video element error:', err);
            const errorMsg = 'Erro no elemento de vídeo: ' + (err.message || 'Erro desconhecido');
            handleError(errorMsg);
            setIsLoading(false);
          };
        } else {
          console.error('Video ref is null after getUserMedia');
          const errorMsg = 'Erro interno: referência de vídeo não encontrada após inicialização da câmera';
          handleError(errorMsg);
          setIsLoading(false);
        }
      } catch (initialErr) {
        // Check if component is still mounted
        if (!isMounted) return;
        
        console.warn('Failed with initial constraints, trying fallback:', initialErr);
        
        // Try with more specific fallback constraints
        try {
          const fallbackConstraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { max: 15 }
            },
            audio: false
          };
          
          console.log('Trying fallback constraints:', fallbackConstraints);
          const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          
          // Check if component is still mounted
          if (!isMounted) {
            mediaStream.getTracks().forEach(track => track.stop());
            return;
          }
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.onloadedmetadata = () => {
              // Check if component is still mounted
              if (!isMounted) return;
              
              videoRef.current.play()
                .then(() => {
                  // Check if component is still mounted
                  if (!isMounted) return;
                  
                  setIsCameraActive(true);
                  setStream(mediaStream);
                  setIsLoading(false);
                })
                .catch(err => {
                  // Check if component is still mounted
                  if (!isMounted) return;
                  
                  const errorMsg = 'Erro ao iniciar a reprodução de vídeo: ' + err.message;
                  handleError(errorMsg);
                  setIsLoading(false);
                });
            };
          } else {
            // Check if component is still mounted
            if (!isMounted) return;
            
            console.error('Video ref is null in fallback');
            const errorMsg = 'Erro interno: referência de vídeo não encontrada no modo de fallback';
            handleError(errorMsg);
            setIsLoading(false);
          }
        } catch (fallbackErr) {
          // Check if component is still mounted
          if (!isMounted) return;
          
          throw fallbackErr; // Re-throw to be caught by the outer catch
        }
      }
    } catch (err) {
      // Check if component is still mounted
      if (!isMounted) return;
      
      console.error('Error accessing camera:', err);
      
      let errorMsg = 'Erro ao acessar a câmera: ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permissão para acessar a câmera foi negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Nenhuma câmera encontrada. Verifique se seu dispositivo tem uma câmera disponível.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'A câmera está em uso por outro aplicativo ou não pode ser acessada.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'As configurações solicitadas para a câmera não são suportadas pelo seu dispositivo.';
      } else if (err.name === 'TypeError' || err.name === 'TypeError') {
        errorMsg = 'Erro de tipo ao acessar a câmera. Verifique as permissões do navegador.';
      } else {
        errorMsg += err.message || 'Erro desconhecido';
      }
      
      handleError(errorMsg);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    console.log('Toggling camera to:', newFacingMode);
    setFacingMode(newFacingMode);
    
    // Restart camera with new facing mode
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        if (isMounted) {
          startCamera();
        }
      }, 300); // Small delay to ensure previous camera is fully stopped
    }
  };

  const captureImage = () => {
    if (!isMounted) return;
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref is null');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Capturing image with dimensions:', canvas.width, 'x', canvas.height);
      
      // Draw the current video frame on the canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL (base64 encoded image)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert data URL to Blob
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
          // Check if component is still mounted
          if (!isMounted) return;
          
          // Create a File object from the Blob
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          
          console.log('Image captured successfully, file size:', file.size, 'bytes');
          
          // Pass the file to parent component
          onImageCapture(file, imageDataUrl);
          
          // Stop the camera
          stopCamera();
        })
        .catch(err => {
          // Check if component is still mounted
          if (!isMounted) return;
          
          console.error('Error creating file from blob:', err);
          const errorMsg = 'Erro ao processar a imagem capturada: ' + err.message;
          handleError(errorMsg);
        });
    } catch (err) {
      // Check if component is still mounted
      if (!isMounted) return;
      
      console.error('Error capturing image:', err);
      const errorMsg = 'Erro ao capturar imagem: ' + err.message;
      handleError(errorMsg);
    }
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
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress color="primary" size={60} thickness={4} />
            <Typography variant="body1" color="white" sx={{ mt: 2 }}>
              Iniciando câmera...
            </Typography>
          </Box>
        ) : isCameraActive ? (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 3
          }}>
            <PhotoCameraIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" align="center" gutterBottom color="white">
              Usar a câmera para capturar uma imagem
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
              <Typography variant="body2" color="white" align="center">
                Clique no botão abaixo para ativar a câmera
              </Typography>
            )}
          </Box>
        )}
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
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
            }
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
        {isCameraActive ? (
          <>
            <IconButton 
              color="primary"
              onClick={toggleCamera}
              aria-label="alternar câmera"
            >
              <FlipCameraIosIcon />
            </IconButton>
            
            <Button
              variant="contained"
              color="primary"
              onClick={captureImage}
              sx={{ 
                borderRadius: 8,
                px: 3,
                py: 1
              }}
            >
              Capturar Foto
            </Button>
            
            <IconButton 
              color="error"
              onClick={stopCamera}
              aria-label="desativar câmera"
            >
              <CloseIcon />
            </IconButton>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={startCamera}
            startIcon={<PhotoCameraIcon />}
            sx={{ py: 1 }}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando...' : 'Ativar Câmera'}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default CameraCapture; 