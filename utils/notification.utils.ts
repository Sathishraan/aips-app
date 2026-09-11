import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as RootNavigation from '../navigation/RootNavigation';
import {
    findLinkedStudent,
    inferLinkedStudentFromText,
    switchLinkedStudent,
    getLinkedStudentsState,
} from '../store/linkedStudents.store';
import { getSelectedStudentId } from '../api/selectedStudent';

/** Expo Go (SDK 53+) cannot register Android remote push tokens. */
export const isExpoGo = Constants.appOwnership === 'expo';

let notificationsMod: any = undefined;

function getNotifications(): any | null {
    if (isExpoGo) return null;
    if (notificationsMod === undefined) {
        try {
            notificationsMod = require('expo-notifications');
        } catch (error) {
            console.warn('⚠️ [Notifications] Native module unavailable:', error);
            notificationsMod = null;
        }
    }
    return notificationsMod;
}

/** Currently open chat id — suppress local popup while parent is already viewing that chat */
let activeChatId: string | null = null;

export const setActiveChatId = (chatId: string | null) => {
    activeChatId = chatId ? chatId.toString() : null;
};

export const getActiveChatId = () => activeChatId;

export type AppNotificationData = {
    type?: string;
    screen?: string;
    chatId?: string;
    classId?: string;
    sectionId?: string;
    title?: string;
    body?: string;
    studentId?: string;
    stud_id?: string;
    stud_no?: string;
    studentName?: string;
    homeworkId?: string;
    [key: string]: any;
};

/**
 * Ask parent for notification permission (Android 13+ / iOS).
 * Call on app start and after login.
 */
export async function ensureNotificationPermissions(): Promise<boolean> {
    if (isExpoGo) {
        console.log('📱 [Notifications] Expo Go — remote push skipped (use a dev build)');
        return false;
    }
    if (!Device.isDevice) {
        console.log('📱 [Notifications] Simulator — push not available');
        return false;
    }

    try {
        const Notifications = getNotifications();
        if (!Notifications) return false;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('📵 [Notifications] Permission not granted');
            return false;
        }

        await setupNotificationChannels();
        return true;
    } catch (error) {
        console.warn('⚠️ [Notifications] Permission error:', error);
        return false;
    }
}

export async function setupNotificationChannels() {
    if (Platform.OS !== 'android') return;
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5a6898',
        sound: 'default',
        description: 'Chat messages from school staff',
    });

    await Notifications.setNotificationChannelAsync('updates', {
        name: 'School Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5a6898',
        sound: 'default',
        description: 'Gallery, homework, circular, fees and other updates',
    });

    await Notifications.setNotificationChannelAsync('attendance', {
        name: 'Attendance Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
        sound: 'default',
        description: 'Late arrival and absent alerts for parents',
    });

    await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5a6898',
        sound: 'default',
    });
}

export async function registerForPushNotificationsAsync() {
    if (isExpoGo) {
        return;
    }

    let token;

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
    }

    try {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
            console.log('Failed to get push token for push notification!');
            return;
        }

        const Notifications = getNotifications();
        if (!Notifications) return;
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('FCM Token:', token);
    } catch (error) {
        console.log('Error in registerForPushNotificationsAsync:', error);
    }

    return token;
}

export async function getDeviceId() {
    let deviceId = await SecureStore.getItemAsync('DEVICE_ID');

    if (!deviceId) {
        deviceId = Crypto.randomUUID();
        await SecureStore.setItemAsync('DEVICE_ID', deviceId);
    }

    return deviceId;
}

/**
 * Show a WhatsApp-style popup banner for parents when new data arrives
 * (staff chat, gallery, homework, circular, fees, etc.).
 */
export async function showLocalNotification(options: {
    title: string;
    body: string;
    data?: AppNotificationData;
    channelId?: 'messages' | 'updates' | 'default' | 'attendance';
}) {
    try {
        const granted = await ensureNotificationPermissions();
        if (!granted) return;

        const channelId = options.channelId || 'default';
        const data = options.data || {};

        // Don't popup if parent is already inside that chat
        if (
            data.type === 'message' &&
            data.chatId &&
            activeChatId &&
            activeChatId === data.chatId.toString() &&
            AppState.currentState === 'active'
        ) {
            console.log('🔕 [Notifications] Suppressed — chat already open');
            return;
        }

        const Notifications = getNotifications();
        if (!Notifications) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: options.title,
                body: options.body,
                data,
                sound: true,
                ...(Platform.OS === 'android' ? { channelId } : {}),
            },
            trigger: null, // show immediately
        });

        console.log('🔔 [Notification] Showing:', options.title);
    } catch (error) {
        console.warn('⚠️ [Notifications] Failed to show local notification:', error);
    }
}

/** Map backend / socket module types to screens + titles */
export function resolveModuleNotification(raw: any): {
    title: string;
    body: string;
    screen: string;
    channelId: 'messages' | 'updates' | 'default' | 'attendance';
    data: AppNotificationData;
} {
    const type = String(
        raw?.type || raw?.notification_type || raw?.module || 'update'
    ).toLowerCase();

    const title =
        raw?.title ||
        raw?.notification_title ||
        raw?.subject ||
        defaultTitleForType(type);

    const body =
        raw?.message ||
        raw?.body ||
        raw?.notification_desc ||
        raw?.description ||
        raw?.content ||
        'You have a new update from school';

    const screen = screenForType(type);

    const student = resolveStudentFromPayload(raw, String(title), String(body));

    return {
        title,
        body: String(body).substring(0, 180),
        screen,
        channelId: type === 'message' || type === 'chat'
            ? 'messages'
            : type === 'attendance' || type === 'late' || type === 'late_comers' || type === 'absent'
                ? 'attendance'
                : 'updates',
        data: {
            ...raw,
            type,
            screen,
            chatId: raw?.chatId || raw?.senderId || raw?.fromId,
            classId: raw?.classId || raw?.class_id,
            sectionId: raw?.sectionId || raw?.section_id,
            studentId: student?.studentId,
            stud_id: student?.studentId,
            stud_no: student?.studentNumber,
            studentName: student ? `${student.firstName} ${student.lastName}`.trim() : undefined,
            homeworkId: raw?.homework_id || raw?.homeworkId,
        },
    };
}

function resolveStudentFromPayload(raw: any, title: string, body: string) {
    const ref = String(
        raw?.studentId ||
        raw?.stud_id ||
        raw?.student_id ||
        raw?.stud_no ||
        raw?.admission_no ||
        ''
    );
    if (ref) {
        const found = findLinkedStudent(ref);
        if (found) return found;
    }
    const inferred = inferLinkedStudentFromText(`${title} ${body} ${raw?.student_name || raw?.studentName || ''}`);
    if (inferred) return inferred;
    return findLinkedStudent(getSelectedStudentId()) || getLinkedStudentsState().students[0] || null;
}

function defaultTitleForType(type: string): string {
    switch (type) {
        case 'message':
        case 'chat':
            return 'New message';
        case 'gallery':
            return 'New gallery update';
        case 'homework':
            return 'New homework';
        case 'circular':
            return 'New circular';
        case 'event':
        case 'events':
            return 'New event';
        case 'fee':
        case 'fees':
            return 'Fees update';
        case 'attendance':
        case 'late':
        case 'late_comers':
        case 'absent':
            return 'Attendance update';
        case 'exam':
        case 'result':
            return 'Exam / result update';
        case 'leave':
            return 'Leave update';
        case 'video':
        case 'videos':
            return 'New video';
        default:
            return 'School update';
    }
}

function screenForType(type: string): string {
    switch (type) {
        case 'message':
        case 'chat':
            return 'Communication';
        case 'gallery':
            return 'Gallery';
        case 'homework':
            return 'Homework';
        case 'circular':
            return 'Circular';
        case 'event':
        case 'events':
            return 'Events';
        case 'fee':
        case 'fees':
            return 'Fees';
        case 'attendance':
        case 'late':
        case 'late_comers':
        case 'absent':
            return 'Attendance';
        case 'exam':
        case 'result':
            return 'ExamResults';
        case 'leave':
            return 'LeaveRequest';
        case 'video':
        case 'videos':
            return 'Videos';
        default:
            return 'Notifications';
    }
}

export const handleNotification = async (notification: any) => {
    console.log('Notification received:', notification);

    try {
        const historyStr = await SecureStore.getItemAsync('NOTIFICATION_HISTORY');
        const history = historyStr ? JSON.parse(historyStr) : [];

        const data = (notification.request.content.data || {}) as AppNotificationData;
        const studentId = String(data.studentId || data.stud_id || data.stud_no || getSelectedStudentId() || '');

        const newNotification = {
            id: notification.request.identifier,
            title: notification.request.content.title,
            message: notification.request.content.body,
            data,
            studentId,
            time: new Date().toISOString(),
            isRead: false,
        };

        // Keep history small for SecureStore limits
        const updatedHistory = [newNotification, ...history].slice(0, 20);
        const payload = JSON.stringify(updatedHistory);
        if (payload.length < 1900) {
            await SecureStore.setItemAsync('NOTIFICATION_HISTORY', payload);
        }
    } catch (error) {
        console.error('Error saving notification:', error);
    }
};

export const handleNotificationResponse = (response: any) => {
    console.log('Notification response:', response);
    const data = (response.notification.request.content.data || {}) as AppNotificationData;
    openNotificationForStudent(data);
};

export async function openNotificationForStudent(data: AppNotificationData) {
    const ref = String(data.studentId || data.stud_id || data.stud_no || '');
    if (ref) {
        await switchLinkedStudent(ref);
    }
    navigateFromNotificationData(data);
}

export function navigateFromNotificationData(data: AppNotificationData) {
    const type = String(data.type || '').toLowerCase();
    const screen = data.screen || screenForType(type);
    const homeworkId = data.homeworkId || data.homework_id;

    const go = () => {
        try {
            if (!RootNavigation.navigationRef.isReady()) {
                setTimeout(go, 400);
                return;
            }

            if (homeworkId && (type === 'homework' || screen === 'Homework')) {
                RootNavigation.navigate('HomeworkDetail', { homeworkId: String(homeworkId) });
                return;
            }

            if (type === 'message' || type === 'chat') {
                RootNavigation.navigate('MainTabs', {
                    screen: 'Home',
                    params: { screen: 'Communication' },
                });
                return;
            }

            RootNavigation.navigate('MainTabs', {
                screen: 'Home',
                params: {
                    screen: screen === 'Notifications' ? 'Notifications' : screen,
                },
            });
        } catch (e) {
            console.warn('⚠️ [Notifications] Navigation failed:', e);
            try {
                RootNavigation.navigate('MainTabs');
            } catch {
                /* ignore */
            }
        }
    };

    go();
}
