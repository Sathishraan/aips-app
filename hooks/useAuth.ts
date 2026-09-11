import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData, getData } from '../api/generic.api';
import { LoginRequest, LoginResponse } from '../types/auth.type';
import { Alert, Platform } from 'react-native';
import { setAuthToken } from '../api/base';
import { resetLinkedStudents } from '../store/linkedStudents.store';
import { registerForPushNotificationsAsync, getDeviceId } from '../utils/notification.utils';
import { useE2EE } from './useE2EE';
import { saveAccount, removeAccount, removeAllAccounts, getActiveAccount } from '../store/savedAccounts.store';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const { registerMyPublicKey } = useE2EE();

    const loginMutation = useMutation<
        { serverData: any; credentials: LoginRequest },
        Error,
        LoginRequest
    >({
        mutationFn: async (credentials: LoginRequest) => {
            console.log('🚀 [useAuth] Login Attempt - Format: FormData');

            const [tokenResult, deviceResult] = await Promise.all([
                registerForPushNotificationsAsync(),
                getDeviceId()
            ]);

            const firebaseToken = tokenResult || 'NO_TOKEN';
            const device = deviceResult || 'NO_DEVICE';

            // Create FormData object
            const formData = new FormData();
            formData.append('username', credentials.username.trim());
            formData.append('password', credentials.password);
            formData.append('academic_year', credentials.academic_year || '2024-2025');

            if (firebaseToken) {
                formData.append('firebase_token', firebaseToken);
            }

            formData.append('device_type', Platform.OS === 'android' ? '1' : '2');

            if (device) {
                formData.append('device', device);
            }

            const serverData: any = await postData<LoginResponse>('api/login', formData);
            // Always return a clean wrapper so onSuccess has both pieces
            return { serverData, credentials };
        },

        onSuccess: async ({ serverData, credentials }) => {
            console.log('📥 [useAuth] Login Success. Raw data:', JSON.stringify(serverData, null, 2));

            // Normalise: the token may be at root or inside .data
            const token: string | undefined =
                serverData?.data?.token || serverData?.token;
            const userData = serverData?.data || serverData;
            const userId = userData?.stud_id || userData?.emp_id || userData?.id;

            if (!token) {
                console.warn('⚠️ [useAuth] Login success (HTTP 200) but NO TOKEN in response.');
                // Server returned status=0 (bad credentials) — do nothing, LoginScreen handles UI
                return;
            }

            console.log('🔑 [useAuth] Token found, saving account...');

            const studentName = userData?.stud_firstname
                ? `${userData.stud_firstname} ${userData.stud_lastname || ''}`.trim()
                : userData?.emp_name || userData?.username || credentials.username.trim();

            const userRole = userData?.stud_id
                ? `Student (${userData.stud_class || ''} ${userData.stud_section || ''})`.trim()
                : userData?.emp_id
                ? (userData.emp_designation || 'Staff')
                : (userData?.role || 'User');

            await saveAccount({
                username: credentials.username.trim(),
                token,
                name: studentName,
                role: userRole,
                academicYear: credentials.academic_year || '2024-2025',
                studentId: userData?.stud_id ? String(userData.stud_id) : undefined,
                employeeId: userData?.emp_id ? String(userData.emp_id) : undefined,
            });

            queryClient.invalidateQueries({ queryKey: ['userProfile'] });

            if (userId) {
                registerMyPublicKey(userId.toString());
            }
        },

        onError: (error: any) => {
            console.log('❌ [useAuth] Login Error:', error.message || error);
            if (error.response) {
                console.log('❌ Error Response Body:', JSON.stringify(error.response.data, null, 2));
                console.log('❌ Error Response Status:', error.response.status);
            }
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            try {
                return await getData('api/logout');
            } catch {
                try {
                    return await postData('api/logout', {});
                } catch {
                    return { status: 1 };
                }
            }
        },
        onSettled: async () => {
            const active = getActiveAccount();
            if (active) {
                await removeAccount(active.id);
            } else {
                await setAuthToken(null);
                await resetLinkedStudents();
                queryClient.clear();
            }
        }
    });

    const logout = async () => {
        await logoutMutation.mutateAsync();
        const remaining = getActiveAccount();
        return { hasRemaining: !!remaining, activeAccount: remaining };
    };

    /**
     * Force logout - clears current account local session without waiting for API call.
     */
    const forceLogout = async () => {
        try {
            const active = getActiveAccount();
            if (active) {
                await removeAccount(active.id);
            } else {
                await setAuthToken(null);
                await resetLinkedStudents();
                queryClient.clear();
            }
        } catch (error) {
            console.log('Force logout error:', error);
            queryClient.clear();
        }
        const remaining = getActiveAccount();
        return { hasRemaining: !!remaining, activeAccount: remaining };
    };

    const logoutAll = async () => {
        await removeAllAccounts();
    };

    const isLoading = loginMutation.isPending || logoutMutation.isPending;

    return {
        login: loginMutation.mutate,
        logout,
        forceLogout,
        logoutAll,
        isLoading,
        isError: loginMutation.isError,
        error: loginMutation.error,
        data: loginMutation.data?.serverData,
    };
};
