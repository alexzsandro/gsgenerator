/// <reference types="vite/client" />

declare module 'mammoth/mammoth.browser' {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string
    messages: Array<{ type: string; message: string }>
  }>
}

declare module '*.txt?raw' {
  const content: string
  export default content
}
