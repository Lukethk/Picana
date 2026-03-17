import { useState, useCallback } from 'react';

export function useLocalStorage(key, defaultValue) {
    const [state, setState] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const set = useCallback(
        (val) => {
            setState(val);
            try {
                localStorage.setItem(key, JSON.stringify(val));
            } catch {
                return;
            }
        },
        [key]
    );

    return [state, set];
}
