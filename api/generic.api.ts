import api, { getAuthToken } from './base';
import { getSelectedStudentIds } from './selectedStudent';

// api/generic.api.ts
export const getAuthenticatedUrl = (url: string, options?: { skipStudentScope?: boolean; skipAuthQuery?: boolean }): string => {
  const authToken = getAuthToken();
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || '';

  if (url == null || typeof url !== 'string') {
    return '';
  }

  console.log(`[getAuthenticatedUrl] Input URL: "${url}"`);
  console.log(`[getAuthenticatedUrl] Base URL: "${apiBaseUrl}"`);

  let finalUrl = '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log(`[getAuthenticatedUrl] URL already has protocol, using as-is`);
    finalUrl = url;
    if (
      /\/uploads\/homework\//i.test(finalUrl) &&
      !/\/public\/uploads\/homework\//i.test(finalUrl)
    ) {
      finalUrl = finalUrl.replace(/\/uploads\/homework\//i, '/public/uploads/homework/');
    }
  } else {
    // Clean the path: fix backslashes and collapse multiple slashes
    let cleanPath = url.replace(/\\/g, '/').replace(/\/+/g, '/');

    // Handle server-returned local paths
    if (cleanPath.includes('htdocs/')) {
      cleanPath = cleanPath.split('htdocs/')[1];
      if (cleanPath.startsWith('sparkle-skool-erp/')) {
        cleanPath = cleanPath.replace('sparkle-skool-erp/', '');
      }
    }

    // Ensure normalization without leading slash for joining
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    const base = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    const basePath = base.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\/+|\/+$/g, '');
    if (basePath && (cleanPath === basePath || cleanPath.startsWith(`${basePath}/`))) {
      cleanPath = cleanPath.substring(basePath.length).replace(/^\/+/, '');
    }

    // ERP stores homework files as uploads/homework/... under public/
    if (
      /(?:^|\/)uploads\/homework\//i.test(cleanPath) &&
      !/public\/uploads\/homework\//i.test(cleanPath)
    ) {
      cleanPath = cleanPath.replace(/(?:^|\/)uploads\/homework\//i, 'public/uploads/homework/');
    }

    finalUrl = `${base}/${cleanPath}`;
    console.log(`[getAuthenticatedUrl] Constructed URL: "${finalUrl}"`);
  }

  const isStaticUpload = /(?:^|\/)(?:public\/)?uploads\//i.test(`${url} ${finalUrl}`);

  // Add token and auth if available (skip static files — tokens break Image loads)
  if (authToken && !isStaticUpload && !options?.skipAuthQuery) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    if (!finalUrl.includes('token=')) {
      finalUrl = `${finalUrl}${separator}token=${authToken}`;
    }
    const nextSeparator = finalUrl.includes('?') ? '&' : '?';
    if (!finalUrl.includes('auth=')) {
      finalUrl = `${finalUrl}${nextSeparator}auth=${authToken}`;
    }
  }

  console.log(`[getAuthenticatedUrl] Final URL: "${finalUrl}"`);
  console.log(`[getAuthenticatedUrl] Token Status: ${authToken ? 'TOKEN_OK' : 'TOKEN_MISSING'}`);

  const isApiRoute = !url.startsWith('http://') && !url.startsWith('https://') && url.includes('api/');
  const isDiscoveryRoute =
    url.includes('siblings') ||
    url.includes('student/linked') ||
    url.includes('students/list') ||
    url.includes('students/meta') ||
    url.includes('student/search') ||
    url.includes('students/search') ||
    url.includes('student/family') ||
    url.includes('communication/add') ||
    url.includes('communication/students') ||
    url.includes('attendance/history') ||
    url.includes('attendance/day') ||
    url.includes('leave/pending') ||
    url.includes('leave/history') ||
    url.includes('leave/approve') ||
    url.includes('leave/revoke') ||
    url.includes('leave/staff') ||
    url.includes('homework/create') ||
    url.includes('homework/list') ||
    url.includes('homework/details') ||
    url.includes('subject/list');

  const skipScope =
    options?.skipStudentScope ||
    url.includes('login') ||
    url.includes('logout') ||
    isDiscoveryRoute;

  if (isApiRoute && !skipScope) {
    const { studentId, studentNumber } = getSelectedStudentIds();
    if (studentId && !finalUrl.includes('stud_id=')) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${sep}stud_id=${encodeURIComponent(studentId)}`;
    }
    if (studentNumber && !finalUrl.includes('stud_no=')) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${sep}stud_no=${encodeURIComponent(studentNumber)}`;
    }
  }

  return finalUrl;
};

// React Native FormData often has no .has() — check _parts safely instead
const formDataHas = (fd: any, key: string): boolean => {
  if (typeof fd?.has === 'function') {
    try {
      return fd.has(key);
    } catch {
      // fall through
    }
  }
  if (Array.isArray(fd?._parts)) {
    return fd._parts.some((part: any) => Array.isArray(part) && part[0] === key);
  }
  return false;
};

export const getData = async <T>(url: string, options?: { skipStudentScope?: boolean }): Promise<T> => {
  const authenticatedUrl = getAuthenticatedUrl(url, options);

  console.log(`📡 [getData] Fetching from: ${authenticatedUrl}`);
  const response = await api.get(authenticatedUrl);
  return response.data;
};

export const updateData = async <TResponse, TRequest>(
  url: string,
  updates: TRequest
): Promise<TResponse> => {

  const authToken = getAuthToken();
  let requestData: any = updates;

  if (authToken) {
    const dataObj = updates as any;
    if (updates && typeof dataObj.append === 'function') {
      if (!formDataHas(dataObj, 'token')) {
        dataObj.append('token', authToken);
      }
      if (!formDataHas(dataObj, 'auth')) {
        dataObj.append('auth', authToken);
      }
      requestData = updates;
    } else if (typeof updates === 'object' && updates !== null) {
      requestData = { ...updates, token: authToken, auth: authToken } as any;
    }
  }

  const response = await api.put(url, requestData);
  return response.data;
};

export const postData = async <T>(url: string, data: any, options?: { timeout?: number }): Promise<T> => {
  const authToken = getAuthToken();
  let requestData = data;

  // More robust FormData check for React Native polyfills
  const isFormData = data && typeof data.append === 'function';

  console.log(`📤 [postData] START url=${url} isFormData=${!!isFormData} hasToken=${!!authToken}`);

  if (authToken) {
    const dataObj = data as any;
    if (isFormData) {
      if (!formDataHas(dataObj, 'token')) {
        dataObj.append('token', authToken);
      }
      if (!formDataHas(dataObj, 'auth')) {
        dataObj.append('auth', authToken);
      }
    } else if (typeof data === 'object' && data !== null) {
      // ONLY spread if it's a plain object, NOT FormData
      data = { ...data, token: authToken, auth: authToken };
      requestData = data;
    }
  }

  if (isFormData) {
    try {
      const finalUrl = getAuthenticatedUrl(url, { skipStudentScope: true, skipAuthQuery: true });
      console.log(`📤 [postData] Sending FormData to: ${finalUrl}`);

      // Using native fetch for FormData to bypass Axios interceptor/header issues in React Native
      const response = await fetch(finalUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'X-Authorization': authToken ? `Bearer ${authToken}` : '',
          'auth': authToken || '',
        },
      });

      const text = await response.text();
      console.log(`📥 [postData] Response status=${response.status} body=`, text?.substring?.(0, 500) || text);
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('❌ [postData] JSON Parse Error. Raw Response:', text);
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {
            // fall through
          }
        }
        if (response.status === 404 || /<!DOCTYPE html>/i.test(text)) {
          throw new Error('Homework API not found. Check EXPO_PUBLIC_API_BASE_URL.');
        }
        throw new Error('Server did not return a valid response. Try again without a large image, or check ERP.');
      }
    } catch (error) {
      console.error('❌ [postData] Network/Fetch Error (FormData):', error);
      throw error;
    }
  }

  // Fallback to Axios for standard JSON requests
  console.log(`📤 [postData] Sending JSON to: ${url}`);
  const response = await api.post(url, data, {
    timeout: options?.timeout,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Authorization': authToken ? `Bearer ${authToken}` : '',
      'auth': authToken || '',
    }
  });

  return response.data;
};

export const uploadData = async <T>(url: string, formData: FormData): Promise<T> => {
  const authToken = getAuthToken();
  if (authToken) {
    if (!formDataHas(formData, 'token')) {
      formData.append('token', authToken);
    }
    if (!formDataHas(formData, 'auth')) {
      formData.append('auth', authToken);
    }
  }

  const response = await api.post(url, formData);
  return response.data;
};
