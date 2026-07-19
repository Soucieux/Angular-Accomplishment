/**
 * Value object representing a movie item. Holds all movie metadata
 * (name, year, genre, rate, cover image, etc.) with getters and setters.
 * Used throughout the app as the primary data transfer object for movies.
 */
export class MovieItemVO {
	private id: number = -1;
	private genre: string = '';
	private rate: number = -1;
	private coverImageDownloadableLink: string = '';
	private firstReleaseDate: string = '';
	private episodeNumber: number = -1;
	private coverImage: Blob | null = null;
	private movieKey: string = '';
	private sessionId: number = -1;
	private isFavourite: boolean = false;
	private description: string = '';
	private actors: string = '';
	private openid: string = '';

	constructor();

	constructor(title: string, year: number);

	constructor(private title?: string, private year?: number) {
		if (this.year) {
			this.year = typeof year === 'string' ? Number(year) : year;
		}
	}

	/**
	 * Gets the movie name.
	 *
	 * @returns The movie name, or empty string if not set.
	 */
	public getMovieName(): string {
		return this.title ? this.title : '';
	}

	/**
	 * Gets the Douban movie ID.
	 *
	 * @returns The movie ID, or -1 if not set.
	 */
	public getMovieId(): number {
		return this.id;
	}

	/**
	 * Gets the movie genre.
	 *
	 * @returns The genre string, or empty string if not set.
	 */
	public getMovieGenre(): string {
		return this.genre;
	}

	/**
	 * Gets the movie rating.
	 *
	 * @returns The rating value, or -1 if not set.
	 */
	public getMovieRate(): number {
		return this.rate;
	}

	/**
	 * Gets the downloadable link for the movie cover image.
	 *
	 * @returns The cover image URL, or empty string if not set.
	 */
	public getMovieCoverImageDownloadableLink(): string {
		return this.coverImageDownloadableLink;
	}

	/**
	 * Gets the movie release year.
	 *
	 * @returns The year, or -1 if not set.
	 */
	public getMovieYear(): number {
		return this.year ? this.year : -1;
	}

	/**
	 * Gets the movie first release date.
	 *
	 * @returns The release date string (e.g. "2024.01.15"), or empty string if not set.
	 */
	public getMovieFirstReleaseDate(): string {
		return this.firstReleaseDate;
	}

	/**
	 * Gets the total number of episodes.
	 *
	 * @returns The episode count, or -1 if not set.
	 */
	public getMovieEpisodeNumber(): number {
		return this.episodeNumber;
	}

	/**
	 * Gets the database key of the movie document.
	 *
	 * @returns The document key, or empty string if not set.
	 */
	public getMovieKey(): string {
		return this.movieKey;
	}

	/**
	 * Gets the cover image Blob.
	 *
	 * @returns The cover image Blob, or null if not set.
	 */
	public getMovieCoverImage(): Blob | null {
		return this.coverImage;
	}

	/**
	 * Gets whether the movie is marked as a favourite.
	 *
	 * @returns true if the movie is a favourite.
	 */
	public getIsFavourite(): boolean {
		return this.isFavourite;
	}

	/**
	 * Gets the session ID assigned during rate search.
	 *
	 * @returns The session ID, or -1 if not set.
	 */
	public getSessionId(): number {
		return this.sessionId;
	}

	/**
	 * Gets the movie description.
	 *
	 * @returns The description string, or empty string if not set.
	 */
	public getDescription(): string {
		return this.description;
	}

	/**
	 * Gets the movie actors list.
	 *
	 * @returns The actors string, or empty string if not set.
	 */
	public getActors(): string {
		return this.actors;
	}

	/**
	 * Sets the movie name.
	 *
	 * @param title - The movie name.
	 */
	public setMovieName(title: string) {
		this.title = title;
	}

	/**
	 * Sets the Douban movie ID. Coerces string values to number.
	 *
	 * @param id - The movie ID.
	 */
	public setMovieId(id: number) {
		this.id = typeof id === 'string' ? Number(id) : id;
	}

	/**
	 * Sets the movie genre.
	 *
	 * @param genre - The genre string.
	 */
	public setMovieGenre(genre: string) {
		this.genre = genre;
	}

	/**
	 * Sets the movie rating, normalising every "no rating" form to the -1 sentinel.
	 * The third-party API returns an empty string for an unrated title, which would coerce
	 * to 0, and legacy database rows still hold that 0 — so both converge here rather than
	 * at each caller. No-ops if the value is null or undefined.
	 *
	 * @param rate - The rating value.
	 */
	public setMovieRate(rate: number) {
		if (rate === null || rate === undefined) return;
		const numericRate = Number(rate);
		this.rate = numericRate > 0 ? numericRate : -1;
	}

	/**
	 * Gets whether the movie carries a real rating, as opposed to the -1 unresolved sentinel.
	 *
	 * @returns True when a rating has been resolved for this movie.
	 */
	public hasRate(): boolean {
		return this.rate > 0;
	}

	/**
	 * Sets the movie release year.
	 *
	 * @param year - The year.
	 */
	public setMovieYear(year: number) {
		this.year = year;
	}

	/**
	 * Sets the downloadable link for the movie cover image.
	 *
	 * @param coverImageDownloadableLink - The cover image URL.
	 */
	public setMovieCoverImageDownloadableLink(coverImageDownloadableLink: string) {
		this.coverImageDownloadableLink = coverImageDownloadableLink;
	}

	/**
	 * Sets the movie first release date.
	 *
	 * @param firstReleaseDate - The release date string.
	 */
	public setMovieFirstReleaseDate(firstReleaseDate: string) {
		this.firstReleaseDate = firstReleaseDate;
	}

	/**
	 * Sets the total number of episodes. Coerces string values to number.
	 *
	 * @param episodeNumber - The episode count.
	 */
	public setMovieEpisodeNumber(episodeNumber: number) {
		this.episodeNumber = typeof episodeNumber === 'string' ? Number(episodeNumber) : episodeNumber;
	}

	/**
	 * Sets the database key of the movie document.
	 *
	 * @param movieKey - The document key.
	 */
	public setMovieKey(movieKey: string) {
		this.movieKey = movieKey;
	}

	/**
	 * Sets the cover image Blob.
	 *
	 * @param coverImage - The cover image Blob.
	 */
	public setMovieCoverImage(coverImage: Blob | null) {
		this.coverImage = coverImage;
	}

	/**
	 * Sets the session ID for rate search tracking.
	 *
	 * @param sessionId - The session ID.
	 */
	public setSessionId(sessionId: number) {
		this.sessionId = sessionId;
	}

	/**
	 * Sets whether the movie is a favourite. Falls back to false if null/undefined.
	 *
	 * @param isFavourite - The favourite flag.
	 */
	public setIsFavourite(isFavourite: boolean) {
		this.isFavourite = isFavourite ?? false;
	}

	/**
	 * Sets the movie description.
	 *
	 * @param description - The description string.
	 */
	public setDescription(description: string) {
		this.description = description;
	}

	/**
	 * Sets the movie actors list.
	 *
	 * @param actors - The actors string.
	 */
	public setActors(actors: string) {
		this.actors = actors;
	}

	/**
	 * Returns the CloudBase owner ID stored on the database document.
	 *
	 * @returns The owner openid string, or empty string if not set.
	 */
	public getOpenId(): string {
		return this.openid;
	}

	/**
	 * Sets the CloudBase owner ID from the database document.
	 *
	 * @param openid - The _openid field value from the CloudBase document.
	 */
	public setOpenId(openid: string) {
		this.openid = openid;
	}
}
