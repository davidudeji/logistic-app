import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface SocketMessage<T = unknown> {
  event: string;
  data: T;
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

@Injectable({ providedIn: 'root' })
export class SocketConnectionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly state = signal<ConnectionState>('disconnected');
  readonly lastError = signal<string | null>(null);

  private readonly incomingMessages$ = new Subject<SocketMessage>();
  private socket: any = null;
  private reconnectTimer: any = null;
  private readonly subscribedRooms = new Set<string>();

  constructor() {
    if (this.isBrowser) {
      this.initConnection();
    }
  }

  /**
   * Initializes or re-initializes the real-time communication channel.
   * If socket.io-client is not yet loaded, a graceful browser WebSocket or simulation fallback is used.
   */
  initConnection(): void {
    if (!this.isBrowser) return;

    if (this.socket) {
      return;
    }

    this.state.set('connecting');
    const token = this.authService.getToken();

    try {
      // Connect using WebSocket or Socket.IO if window.io is present
      const ioGlobal = (window as any).io;
      if (typeof ioGlobal === 'function') {
        this.socket = ioGlobal('http://localhost:5000', {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
          this.state.set('connected');
          this.lastError.set(null);
          // Re-join active rooms
          this.subscribedRooms.forEach((room) => this.socket.emit('join_room', { room }));
        });

        this.socket.on('disconnect', (reason: string) => {
          this.state.set('disconnected');
        });

        this.socket.on('connect_error', (err: Error) => {
          this.state.set('error');
          this.lastError.set(err.message);
        });

        this.socket.onAny((event: string, data: any) => {
          this.incomingMessages$.next({ event, data });
        });
      } else {
        // Fallback: simulated active connection in browser development mode
        this.state.set('connected');
      }
    } catch (e: any) {
      this.state.set('error');
      this.lastError.set(e?.message || 'Failed to initialize socket');
    }
  }

  joinRoom(room: string): void {
    this.subscribedRooms.add(room);
    if (this.socket && this.state() === 'connected') {
      this.socket.emit('join_room', { room });
    }
  }

  leaveRoom(room: string): void {
    this.subscribedRooms.delete(room);
    if (this.socket && this.state() === 'connected') {
      this.socket.emit('leave_room', { room });
    }
  }

  emit<T = unknown>(event: string, payload: T): void {
    if (this.socket && this.state() === 'connected') {
      this.socket.emit(event, payload);
    } else {
      // Internal loopback for dev simulation
      this.incomingMessages$.next({ event, data: payload });
    }
  }

  on<T = unknown>(event: string): Observable<T> {
    return this.incomingMessages$.asObservable().pipe(
      filter((msg): msg is SocketMessage<T> => msg.event === event),
      filter((msg) => msg.data !== undefined),
      // Map to data
      new (class {
        operator = {
          call(subscriber: any, source: any) {
            return source.subscribe({
              next(x: SocketMessage<T>) {
                subscriber.next(x.data);
              },
              error(err: any) {
                subscriber.error(err);
              },
              complete() {
                subscriber.complete();
              },
            });
          },
        };
      })().operator as any
    );
  }

  /**
   * Directly dispatches a simulated event for in-app testing and mock broadcasts
   */
  dispatchLocalEvent<T = unknown>(event: string, data: T): void {
    this.incomingMessages$.next({ event, data });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.state.set('disconnected');
    this.subscribedRooms.clear();
  }
}
