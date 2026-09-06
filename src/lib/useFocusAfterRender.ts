import { useEffect, useRef } from "react";

/**
 * Keyboard focus for actions whose button unmounts as a result of the action
 * (e.g. swapping which copy a job links to re-renders the rows). Call the
 * returned function with the id of the element that should hold focus once
 * the next render has committed.
 */
export function useFocusAfterRender(): (id: string) => void {
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (pending.current === null) return;
    const el = document.getElementById(pending.current);
    pending.current = null;
    if (el instanceof HTMLElement) el.focus();
  });
  return (id: string) => {
    pending.current = id;
  };
}
