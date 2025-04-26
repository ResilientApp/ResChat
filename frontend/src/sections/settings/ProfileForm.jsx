import React, { useState, useCallback, useEffect } from 'react';
import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import FormProvider from '../../components/hook-form/FormProvider';
import { yupResolver } from '@hookform/resolvers/yup';
import { Alert, Button, Stack, Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { RHFTextField } from '../../components/hook-form';
import { useDropzone } from 'react-dropzone';
import { UploadSimple, User } from 'phosphor-react';
import { uploadAvatar, refreshAvatars } from '../../services/chat';
import { useDispatch } from 'react-redux';
import { showNotification, setFriendList } from '../../redux/slices/app.jsx';
import axios from '../../utils/axios';

const ProfileForm = () => {
  const dispatch = useDispatch();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const username = localStorage.getItem('username');
  const currentAvatarCid = localStorage.getItem('avatar_cid');

  // Load the current avatar if available
  useEffect(() => {
    if (currentAvatarCid) {
      const avatarUrl = `${axios.defaults.baseURL}/profile_pictures/${currentAvatarCid}.jpg`;
      setAvatarPreview(avatarUrl);
    }
  }, [currentAvatarCid]);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setAvatarFile(file);
      
      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // Clean up the preview URL when component unmounts
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': ['.jpeg', '.jpg', '.png']},
    maxFiles: 1
  });

  //validation rules 
  const profileSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    about: Yup.string().required('About is required'),
  });

  const defaultValues = {
    name: '',
    about: ''
  };

  const methods = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues
  });

  const { reset, setError, handleSubmit, formState: { errors } } = methods;

  const handleAvatarUpdate = async () => {
    if (!avatarFile) return false;
    
    setUploading(true);
    try {
      const response = await uploadAvatar(avatarFile);
      
      if (response.result) {
        // Update local storage with new avatar CID
        if (response.avatar_cid) {
          localStorage.setItem('avatar_cid', response.avatar_cid);
          
          // Refresh the avatars for all friends to ensure they get the latest avatar
          try {
            const refreshResponse = await refreshAvatars();
            if (refreshResponse.result && refreshResponse.friend_list) {
              dispatch(setFriendList(refreshResponse.friend_list));
            }
          } catch (refreshError) {
            console.error('Error refreshing avatars after update:', refreshError);
          }
          
          dispatch(showNotification({
            message: 'Profile picture updated successfully',
            type: 'success'
          }));
          return true;
        }
      } else {
        throw new Error(response.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      dispatch(showNotification({
        message: error.message || 'Failed to update profile picture',
        type: 'error'
      }));
      return false;
    } finally {
      setUploading(false);
    }
    return false;
  };

  const onSubmit = async (data) => {
    try {
      setUploading(true);
      
      // First update the avatar if a new one was selected
      if (avatarFile) {
        const avatarUpdateSuccess = await handleAvatarUpdate();
        if (!avatarUpdateSuccess) {
          throw new Error('Failed to update profile picture');
        }
      }
      
      // Here you would update other profile data (name, about, etc.)
      // For now just logging the data
      console.log('Profile data updated:', data);
      
      dispatch(showNotification({
        message: 'Profile updated successfully',
        type: 'success'
      }));
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('afterSubmit', {
        ...error,
        message: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {!!errors.afterSubmit && (
          <Alert severity='error'>{errors.afterSubmit.message}</Alert>
        )}
        
        {/* Avatar Upload Section */}
        <Stack alignItems="center" spacing={2}>
          <Typography variant="subtitle1" gutterBottom>
            Profile Picture
          </Typography>
          
          {/* Current Avatar Display */}
          <Avatar
            src={avatarPreview}
            alt={username || "User"}
            sx={{ width: 100, height: 100, mb: 2 }}
          >
            {!avatarPreview && <User size={60} weight="light" />}
          </Avatar>
          
          {/* Avatar Upload Dropzone */}
          <Box 
            {...getRootProps()} 
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              width: '100%',
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <input {...getInputProps()} />
            <UploadSimple size={24} style={{ marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary">
              {avatarFile 
                ? `Selected: ${avatarFile.name}` 
                : 'Drag & drop a new profile picture, or click to select'}
            </Typography>
          </Box>
        </Stack>
        
        {/* Profile Information */}
        <Stack spacing={3}>
          <RHFTextField 
            name='name' 
            label='Name' 
            helperText='This name is visible to your contacts'
          />
          <RHFTextField 
            multiline 
            rows={3} 
            maxRows={5} 
            name='about' 
            label='About'
          />
        </Stack>
        
        {/* Submit Button */}
        <Stack direction='row' justifyContent='end'>
          <Button 
            color='primary' 
            size='large' 
            type='submit' 
            variant='contained'
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {uploading ? 'Updating...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

export default ProfileForm;