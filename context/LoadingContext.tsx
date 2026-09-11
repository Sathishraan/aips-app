import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    showLoading: () => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [loadingCount, setLoadingCount] = useState(0);

    const showLoading = () => setLoadingCount(count => count + 1);
    const hideLoading = () => setLoadingCount(count => Math.max(0, count - 1));

    return (
        <LoadingContext.Provider value={{ isLoading: loadingCount > 0, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
