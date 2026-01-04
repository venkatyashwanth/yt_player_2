import { useCallback, useEffect, useState } from "react";

export function useToast(timeout = 1000) {
    const [toast, setToast] = useState(null);
    const showToast = useCallback((message) => {
        setToast(message);
    }, []);
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), timeout);
        return () => clearTimeout(t);
    }, [toast, timeout])

    return {
        toast,
        showToast,
        clearToast: () => setToast(null)
    }
}