
'use client';

import React, { useEffect } from 'react';
import { enablePersistence } from './firebase';

export function FirebasePersistenceProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        enablePersistence();
    }, []);

    return <>{children}</>;
}
