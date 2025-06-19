import React from 'react';

/**
 * Calls the callback with a boolean indicating if the page is visible.
 * Cleans up the event listener on unmount.
 */
function usePageVisibility(onChange: (isVisible: boolean) => void) {
  React.useEffect(() => {
    function handleVisibilityChange() {
      onChange(!document.hidden);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Call once on mount
    onChange(!document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onChange]);
}

/**
 * Wrapper component that calls the onChange callback whenever the page visibility changes.
 * Children are always rendered.
 */
export function PageVisibilityHandler({
  onChange,
  children,
}: {
  onChange: (isVisible: boolean) => void;
  children: React.ReactNode;
}) {
  usePageVisibility(onChange);
  return <>{children}</>;
}
