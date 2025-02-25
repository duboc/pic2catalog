import React, { useState, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTheme } from '@mui/material/styles';

const FileUpload = ({ onFileSelect, isLoading }) => {
  const theme = useTheme();
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        mb: 4,
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <Box
        className="file-upload-container"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          width: '100%',
          maxWidth: 600,
          mx: 'auto',
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: isLoading ? '2px dashed #FBBC05' : '2px dashed #4285F4',
          borderRadius: '8px',
          padding: '2rem',
          backgroundColor: isLoading ? 'rgba(251, 188, 5, 0.04)' : 'rgba(66, 133, 244, 0.04)',
          transition: 'all 0.3s ease',
          cursor: isLoading ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: isLoading ? 'rgba(251, 188, 5, 0.04)' : 'rgba(66, 133, 244, 0.08)',
            borderColor: isLoading ? '#FBBC05' : '#1a73e8',
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#FBBC05', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Gerando Catálogo...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Isso pode levar alguns segundos
            </Typography>
          </Box>
        ) : previewUrl ? (
          <Box sx={{ textAlign: 'center' }}>
            <img src={previewUrl} alt="Preview" className="file-preview" style={{ maxHeight: '300px', maxWidth: '100%', borderRadius: '4px' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Clique ou arraste uma nova imagem para alterar
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 60, color: '#4285F4', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Arraste e solte uma imagem aqui
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ou clique para selecionar um arquivo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Formatos suportados: JPG, PNG
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default FileUpload; 