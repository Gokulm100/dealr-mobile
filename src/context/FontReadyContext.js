import React, { createContext, useContext } from 'react';

const FontReadyContext = createContext(false);

export function FontReadyProvider({ ready, children }) {
  return (
    <FontReadyContext.Provider value={!!ready}>
      {children}
    </FontReadyContext.Provider>
  );
}

export function useFontReady() {
  return useContext(FontReadyContext);
}

/**
 * Apply a custom fontFamily only when fonts have successfully loaded.
 * Always clears fontWeight — pairing a weight-specific family (e.g. Sora_800ExtraBold)
 * with fontWeight crashes Android release builds (native Typeface create).
 */
export function fontFamily(ready, family) {
  if (!ready || !family) return null;
  return { fontFamily: family, fontWeight: 'normal' };
}
