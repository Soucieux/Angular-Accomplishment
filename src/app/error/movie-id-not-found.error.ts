export class MovieIdNotFoundError extends Error {
  constructor(movieTitle: string) {
    super(`Movie ID for ${movieTitle} is not found`);
  }
}