import { toast } from 'svelte-sonner';

// Re-export the toast function for direct usage
export { toast };

// Primary orange color values based on our theme
const PRIMARY_BG = 'hsl(24.6, 95%, 53.1%)';
const PRIMARY_FG = 'hsl(60, 9.1%, 97.8%)';
const PRIMARY_BORDER = 'hsl(24.6, 95%, 53.1%)';

/**
 * Show a success toast with the primary orange theme
 */
export function successToast(message: string) {
    toast.success(message, {
        className: 'orange-toast-success',
        descriptionClassName: 'orange-toast-description',
        actionButtonClassName: 'orange-toast-action',
        style: {
            backgroundColor: PRIMARY_BG,
            color: PRIMARY_FG,
            border: `1px solid ${PRIMARY_BORDER}`,
        }
    });
}

/**
 * Show an error toast with destructive styling
 */
export function errorToast(message: string) {
    toast.error(message, {
        className: 'orange-toast-error',
        actionButtonClassName: 'orange-toast-action'
    });
}

/**
 * Show a promise toast with orange success styling
 */
export function promiseToast<T>(
    promise: Promise<T>,
    messages: {
        loading?: string;
        success?: string;
        error?: string;
    } = {}
) {
    const {
        loading = 'Loading...',
        success = 'Success!',
        error = 'Something went wrong!'
    } = messages;

    toast.promise(promise, {
        loading,
        success: {
            title: success,
            className: 'orange-toast-success',
            style: {
                backgroundColor: PRIMARY_BG,
                color: PRIMARY_FG,
                border: `1px solid ${PRIMARY_BORDER}`,
            }
        },
        error: {
            title: error,
            className: 'orange-toast-error'
        }
    });
}

// Simple type-safe toast utilities
export const showToast = {
    success: (message: string) => {
        toast.success(message);
    },

    error: (message: string) => {
        toast.error(message);
    },

    info: (message: string) => {
        toast(message);
    },

    promise: <T>(
        promise: Promise<T>,
        {
            loading = 'Loading...',
            success = 'Success!',
            error = 'Error!'
        } = {}
    ) => {
        return toast.promise(promise, {
            loading,
            success,
            error
        });
    }
}; 