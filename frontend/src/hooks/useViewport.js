import { useState, useEffect } from 'react';

const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 600,
    isTablet: window.innerWidth >= 600 && window.innerWidth < 960,
    isDesktop: window.innerWidth >= 960,
    isLargeScreen: window.innerWidth >= 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 600,
        isTablet: width >= 600 && width < 960,
        isDesktop: width >= 960,
        isLargeScreen: width >= 1200,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

export default useViewport; 