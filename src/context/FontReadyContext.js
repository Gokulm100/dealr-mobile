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

/** Apply a custom fontFamily only when fonts have successfully loaded. */
export function fontFamily(ready, family) {
  return ready && family ? { fontFamily: family } : null;
}
