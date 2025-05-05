import { writable } from 'svelte/store';
import { generateUUID } from '$lib/utils/uuid';

export interface ToastNotification {
    id: string;
    message: string;
    visible: boolean;
    type: 'success' | 'error' | 'info';
    actions?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
    }>;
}

// Create a writable store for toast notifications
const toasts = writable<ToastNotification[]>([]);

// Function to add a toast notification
function addToast(notification: Omit<ToastNotification, 'id' | 'visible'>) {
    const id = generateUUID();

    toasts.update(notifications => [
        ...notifications,
        {
            id,
            visible: true,
            ...notification
        }
    ]);

    return id;
}

// Function to remove a toast notification
function removeToast(id: string) {
    toasts.update(notifications =>
        notifications.filter(notification => notification.id !== id)
    );
}

// Helper functions for common toast types
function success(message: string, actions?: ToastNotification['actions']) {
    return addToast({
        message,
        type: 'success',
        actions
    });
}

function error(message: string, actions?: ToastNotification['actions']) {
    return addToast({
        message,
        type: 'error',
        actions
    });
}

function info(message: string, actions?: ToastNotification['actions']) {
    return addToast({
        message,
        type: 'info',
        actions
    });
}

export default {
    subscribe: toasts.subscribe,
    update: toasts.update,
    set: toasts.set,
    add: addToast,
    remove: removeToast,
    success,
    error,
    info
};