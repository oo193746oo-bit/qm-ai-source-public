const STATE_KEY = "__qmBrandH04Entry";
const STORAGE_KEY = "qm.brand.h04.return.v1";
type Marker = { token: string; url: string; navigationKey: string | null };
type EntryWindow = Window & { navigation?: { currentEntry?: { key?: string } } };

/** No shared history hooks: preserve Next's state, native navigation, scroll and tab order. */
export function installH04ReturnFocus(win: Window, link: HTMLAnchorElement) {
  const entryKey = () => (win as EntryWindow).navigation?.currentEntry?.key ?? null;
  const url = () => win.location.href;
  let frame: number | undefined;
  let disposed = false;
  const restore = () => {
    if (disposed || win.location.pathname !== "/") return;
    try {
      const raw = win.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const marker: Marker = JSON.parse(raw);
      if (!marker.token || marker.url !== url() ||
          win.history.state?.[STATE_KEY] !== marker.token ||
          (marker.navigationKey !== null && marker.navigationKey !== entryKey())) return;
      // Defer until pageshow/popstate has let native history restore its scroll.
      if (frame !== undefined) win.cancelAnimationFrame(frame);
      frame = win.requestAnimationFrame(() => {
        frame = undefined;
        if (disposed || !link.isConnected || marker.url !== url() ||
            win.history.state?.[STATE_KEY] !== marker.token ||
            (marker.navigationKey !== null && marker.navigationKey !== entryKey())) return;
        // Never override focus the user has already moved since the traversal.
        const active = win.document.activeElement;
        if (active && active !== win.document.body && active !== link) return;
        link.focus({ preventScroll: true });
        if (win.document.activeElement === link) {
          try { win.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Persistence may change after scheduling. */ }
        }
      });
    } catch { /* Storage unavailable or invalid: keep the native link usable. */ }
  };
  const arm = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || link.target && link.target !== "_self" ||
        link.hasAttribute("download") || win.location.pathname !== "/") return;
    try {
      const token = win.crypto.randomUUID();
      const state = win.history.state;
      // Do not replace an unfamiliar primitive history payload.
      if (state !== null && (typeof state !== "object" || Array.isArray(state))) return;
      win.history.replaceState({ ...state, [STATE_KEY]: token }, "");
      win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, url: url(), navigationKey: entryKey() }));
    } catch { /* No preventDefault: navigation still works when persistence is blocked. */ }
  };
  const pageshow = (event: PageTransitionEvent) => {
    if (event.persisted) restore();
  };
  link.addEventListener("click", arm);
  win.addEventListener("popstate", restore);
  win.addEventListener("pageshow", pageshow);
  // A non-BFCache history return mounts a new document before/after pageshow.
  if ((win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "back_forward") restore();
  return () => {
    disposed = true;
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    link.removeEventListener("click", arm);
    win.removeEventListener("popstate", restore);
    win.removeEventListener("pageshow", pageshow);
  };
}
