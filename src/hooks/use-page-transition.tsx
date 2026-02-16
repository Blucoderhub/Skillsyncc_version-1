import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

export function usePageTransition() {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current !== location) {
      prevLocation.current = location;
      setIsTransitioning(true);
    }
  }, [location]);

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return { isTransitioning, onTransitionComplete };
}
