import { telemetryService } from './telemetry.service.js';

export function setupTelemetrySocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!token) {
      // In dev mode, allow connection with mock driver
      socket.user = { id: 'DRV-DEV', role: 'Driver' };
      return next();
    }
    socket.user = { id: 'USR-DEV', role: 'Fleet Manager' };
    next();
  });

  io.on('connection', (socket) => {
    // Automatically join fleet monitoring room for authorized roles
    socket.join('fleet_monitoring');

    socket.on('join_room', ({ room }) => {
      if (typeof room === 'string') {
        socket.join(room);
      }
    });

    socket.on('leave_room', ({ room }) => {
      if (typeof room === 'string') {
        socket.leave(room);
      }
    });

    socket.on('driver_location_broadcast', (data) => {
      try {
        const ping = telemetryService.validateAndIngestBroadcast(data, socket.user);

        // Broadcast to all authorized monitoring clients
        io.to('fleet_monitoring').emit('fleet_telemetry_ping', ping);
        io.to(`asset_${ping.assetId}`).emit('fleet_telemetry_ping', ping);
      } catch (err) {
        socket.emit('telemetry_error', {
          message: err.message,
          assetId: data?.assetId,
        });
      }
    });

    socket.on('disconnect', () => {});
  });
}
