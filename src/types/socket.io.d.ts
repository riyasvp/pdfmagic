declare module 'socket.io' {
  export interface Server {
    // Add any needed members here
  }
  
  export function createServer(): Server;
}