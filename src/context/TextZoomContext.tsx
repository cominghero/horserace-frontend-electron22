import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TextZoomContextType {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

const TextZoomContext = createContext<TextZoomContextType | undefined>(undefined);

export const TextZoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('textZoomLevel');
    return saved ? parseFloat(saved) : 1;
  });

  // Update localStorage and apply to document
  useEffect(() => {
    localStorage.setItem('textZoomLevel', zoomLevel.toString());
    document.documentElement.style.setProperty('--text-zoom', zoomLevel.toString());
  }, [zoomLevel]);

  return (
    <TextZoomContext.Provider value={{ zoomLevel, setZoomLevel }}>
      {children}
    </TextZoomContext.Provider>
  );
};

export const useTextZoom = () => {
  const context = useContext(TextZoomContext);
  if (!context) {
    throw new Error('useTextZoom must be used within TextZoomProvider');
  }
  return context;
};