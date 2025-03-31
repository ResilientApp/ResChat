import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import React from 'react'
import RegisterForm from '../../sections/auth/RegisterForm';

const Register = () => {
  return (
    <Stack spacing={2} sx={{mb:5, position:'relative'}}>
        <Typography variant='h4'>
            Get Started With ResChat
        </Typography>
        <Stack direction={'row'} spacing={0.5}>
            <Typography variant='body2'>Allready have an account?</Typography>
            <Link component={RouterLink} to='/auth/login' variant='subtitle2'>Sign in</Link>
        </Stack>
        {/* Register Form */}
        <RegisterForm/>

    </Stack>
  )
}

export default Register