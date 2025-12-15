
export const getSessionId = (): string => {
    if (typeof window === 'undefined') return 'server-side';

    let sessionId = localStorage.getItem('nexus_session_id');
    if (!sessionId) {
        // Generate simple UUID-like string
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            sessionId = crypto.randomUUID();
        } else {
            sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        localStorage.setItem('nexus_session_id', sessionId);
    }
    return sessionId;
};
