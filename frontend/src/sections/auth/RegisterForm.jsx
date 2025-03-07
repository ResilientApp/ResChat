import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import FormProvider from '../../components/hook-form/FormProvider';
import { Alert, Button, IconButton, InputAdornment, Stack, Box, Typography } from '@mui/material';
import { RHFTextField } from '../../components/hook-form';
import { Eye, EyeSlash, UploadSimple } from 'phosphor-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';

const RegisterForm = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setAvatarFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {'image/*': ['.jpeg', '.jpg', '.png']},
        maxFiles: 1
    });

    const registerSchema = Yup.object().shape({
        email: Yup.string().required('Username is required'),
        password: Yup.string().required('Password is required')
    });
  
    const defaultValues = {
        email: '',
        password: ''
    };
  
    const methods = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues
    });
  
    const { reset, setError, handleSubmit, formState: { errors } } = methods;
  
    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('username', data.email);
            formData.append('password', data.password);
            
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            console.log("Signup response:", result);

            if (!result.result) {
                throw new Error(result.message || 'Registration failed');
            }
            navigate('/auth/login');
        } catch (error) {
            console.log("Signup error:", error);
            reset();
            setError('afterSubmit', {
                ...error,
                message: error.message
            });
        }
    };

    return (
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
                {!!errors.afterSubmit && <Alert severity='error'>{errors.afterSubmit.message}</Alert>}
                
                <Box {...getRootProps()} 
                    sx={{
                        border: '2px dashed grey',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: isDragActive ? 'action.hover' : 'background.paper'
                    }}>
                    <input {...getInputProps()} />
                    <UploadSimple size={32} />
                    <Typography>
                        {avatarFile ? `Selected: ${avatarFile.name}` : 'Drag & drop avatar image here, or click to select'}
                    </Typography>
                </Box>

                <RHFTextField name='email' label='Username'/>
                <RHFTextField name='password' label='Password' 
                    type={showPassword ? 'text' : 'password'}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Eye/> : <EyeSlash/>}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                <Button fullWidth color='inherit' size='large' type='submit' variant='contained'
                    sx={{
                        bgcolor: 'text.primary',
                        color: (theme) => theme.palette.mode === 'light' ? 'common.white' : 'grey.800',
                        '&:hover': {
                            bgcolor: 'text.primary',
                            color: (theme) => theme.palette.mode === 'light' ? 'common.white' : 'grey.800',
                        }
                    }}>
                    Create Account
                </Button>
            </Stack>
        </FormProvider>
    );
};

export default RegisterForm;