import React from 'react'

import './globals.css'

/**
 * Frontend root: a pass-through. The real <html>/<body> shell lives in
 * [locale]/layout.tsx so `lang` can reflect the active locale (ADR-0009).
 */
export default function FrontendRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
