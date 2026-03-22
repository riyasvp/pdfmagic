// Type definitions for pdfjs-dist
declare module 'pdfjs-dist' {
  export * from 'pdfjs-dist/types/src/display/api';
  
  // Add any additional exports you need
  export const version: string;
  
  export namespace GlobalWorkerOptions {
    export let workerSrc: string;
  }
}