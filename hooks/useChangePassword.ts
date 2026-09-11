import { useMutation } from '@tanstack/react-query';
import { postData } from '../api/generic.api';
import { Alert } from 'react-native';

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data: any) => postData('api/password/change', data),
        onSuccess: (data: any) => {
            // You can add global success handling here if needed
        },
        onError: (error: any) => {
            console.error('Change Password Hook Error:', error);
        }
    });
};
