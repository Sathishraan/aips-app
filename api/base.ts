import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

const getBaseUrl = (url?: string) => {
  if (!url) return '';
  return url.endsWith('/') ? url : `${url}/`;
};

const api = axios.create({
  baseURL: getBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Authorization': '',
  },
});

const NODE_URL = process.env.EXPO_PUBLIC_NODE_URL || '';
const sanitizedNodeUrl = NODE_URL.replace('http://', 'http://');

export const nodeApi = axios.create({
  baseURL: getBaseUrl(sanitizedNodeUrl),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Authorization': '',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log('\n' + '='.repeat(80));
    console.log('🔑 AUTHENTICATION TOKEN SET');
    console.log('='.repeat(80));
    console.log('Copy this token for API testing:');
    console.log('\n' + token + '\n');
    console.log('='.repeat(80) + '\n');
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    console.log('🔓 Token cleared');
  }
};

export const getAuthToken = () => authToken;

export const initAuth = async () => {
  const { initSavedAccounts } = require('../store/savedAccounts.store');
  await initSavedAccounts();
  const token = authToken;
  if (token) {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 TOKEN LOADED FROM STORAGE');
    console.log('='.repeat(80));
    console.log('Your authentication token:');
    console.log('\n' + token + '\n');
    console.log('='.repeat(80) + '\n');
  } else {
    console.log('⚠️ No token found in storage - please log in');
  }
  return authToken;
};

// Add request interceptor
const addAuthInterceptor = (instance: any, name: string) => {
  instance.interceptors.request.use(
    (config: any) => {
      if (name === 'nodeApi') {
        console.log(`🌐 [${name}] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }

      if (authToken) {
        if (name === 'nodeApi') {
          // Node server gets the full set of headers
          config.headers.Authorization = `Bearer ${authToken}`;
          config.headers['X-Authorization'] = `Bearer ${authToken}`;
          config.headers['auth'] = authToken;
          console.log(`🔑 [${name}] Full tokens attached`);
        } else {
          // PHP server (api) gets a cleaner set to avoid middleware conflicts
          // We rely more on query parameters added in generic.api.ts
          config.headers['X-Authorization'] = `Bearer ${authToken}`;
          config.headers['auth'] = authToken;
          // Note: We deliberately OMÌT 'Authorization: Bearer' for PHP GET requests
          // if they are already handled by query params to avoid "Multiple Auth" errors.
        }
      } else {
        console.warn(`⚠️ [${name}] NO AUTH TOKEN AVAILABLE!`);
      }
      return config;
    },
    (error: any) => {
      console.error(`❌ [${name}] Request Error:`, error);
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(api, 'api');
addAuthInterceptor(nodeApi, 'nodeApi');

// Add response interceptor to handle auth errors
const addResponseInterceptor = (instance: any, name: string) => {
  instance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      const rawUrl = error.config?.url || '';
      const baseURL = error.config?.baseURL || '';
      const fullUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
        ? rawUrl
        : `${baseURL}${rawUrl}`;

      if (error.response?.status === 401) {
        console.error(`🚫 [${name}] 401 Unauthorized - Token may be invalid or expired`);
        console.error(`🚫 [${name}] Error details:`, {
          url: fullUrl,
          message: error.response?.data?.error || error.message,
          token: authToken ? `${authToken.substring(0, 20)}...` : 'NO TOKEN'
        });
      } else if (error.response?.status === 404) {
        console.error(`🔍 [${name}] 404 Not Found`);
        console.error(`🔍 [${name}] URL: ${fullUrl}`);
        if (error.response?.data?.error || error.response?.data?.message) {
          console.error(`🔍 [${name}] Server Message: ${error.response?.data?.error || error.response?.data?.message}`);
        } else {
          console.error(`🔍 [${name}] The endpoint itself or the requested resource does not exist.`);
        }
      } else if (error.response?.status === 500) {
        console.error(`💥 [${name}] 500 Internal Server Error`);
        console.error(`💥 [${name}] URL: ${fullUrl}`);
        console.error(`💥 [${name}] Data:`, JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error(`⚠️ [${name}] Error ${error.response?.status || 'Network'}:`, error.message);
      }
      return Promise.reject(error);
    }
  );
};

addResponseInterceptor(api, 'api');
addResponseInterceptor(nodeApi, 'nodeApi');

export default api;
