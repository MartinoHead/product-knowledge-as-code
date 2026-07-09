export class DatabaseUnavailableError extends Error {
  constructor(message = 'Persistent database is unavailable.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}
