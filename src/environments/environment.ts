export const environment = {
  apiBaseUrl: 'http://localhost:5000/api/v1',
  trackingSocketUrl: 'http://localhost:5000',
  trackingPollIntervalMs: 10_000,
  trackingMap: {
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};
