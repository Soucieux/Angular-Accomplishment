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
	 * Get the movie name.
	 *
	 * @returns The movie name, or empty string if not set.
	 */
	getMovieName(): string {
		return this.title ? this.title : '';
	}

	/**
	 * Get the Douban movie ID.
	 *
	 * @returns The movie ID, or -1 if not set.
	 */
	getMovieId(): number {
		return this.id;
	}

	/**
	 * Get the movie genre.
	 *
	 * @returns The genre string, or empty string if not set.
	 */
	getMovieGenre(): string {
		return this.genre;
	}

	/**
	 * Get the movie rating.
	 *
	 * @returns The rating value, or -1 if not set.
	 */
	getMovieRate(): number {
		return this.rate;
	}

	/**
	 * Get the downloadable link for the movie cover image.
	 *
	 * @returns The cover image URL, or empty string if not set.
	 */
	getMovieCoverImageDownloadableLink(): string {
		return this.coverImageDownloadableLink;
	}

	/**
	 * Get the movie release year.
	 *
	 * @returns The year, or -1 if not set.
	 */
	getMovieYear(): number {
		return this.year ? this.year : -1;
	}

	/**
	 * Get the movie first release date.
	 *
	 * @returns The release date string (e.g. "2024.01.15"), or empty string if not set.
	 */
	getMovieFirstReleaseDate(): string {
		return this.firstReleaseDate;
	}

	/**
	 * Get the total number of episodes.
	 *
	 * @returns The episode count, or -1 if not set.
	 */
	getMovieEpisodeNumber(): number {
		return this.episodeNumber;
	}

	/**
	 * Get the database key of the movie document.
	 *
	 * @returns The document key, or empty string if not set.
	 */
	getMovieKey(): string {
		return this.movieKey;
	}

	/**
	 * Get the cover image Blob.
	 *
	 * @returns The cover image Blob, or null if not set.
	 */
	public getMovieCoverImage(): Blob | null {
		return this.coverImage;
	}

	/**
	 * Get whether the movie is marked as a favourite.
	 *
	 * @returns true if the movie is a favourite.
	 */
	getIsFavourite(): boolean {
		return this.isFavourite;
	}

	/**
	 * Get the session ID assigned during rate search.
	 *
	 * @returns The session ID, or -1 if not set.
	 */
	getSessionId(): number {
		return this.sessionId;
	}

	/**
	 * Get the movie description.
	 *
	 * @returns The description string, or empty string if not set.
	 */
	public getDescription(): string {
		return this.description;
	}

	/**
	 * Get the movie actors list.
	 *
	 * @returns The actors string, or empty string if not set.
	 */
	public getActors(): string {
		return this.actors;
	}

	/**
	 * Set the movie name.
	 *
	 * @param title - The movie name.
	 */
	setMovieName(title: string) {
		this.title = title;
	}

	/**
	 * Set the Douban movie ID. Coerces string values to number.
	 *
	 * @param id - The movie ID.
	 */
	setMovieId(id: number) {
		this.id = typeof id === 'string' ? Number(id) : id;
	}

	/**
	 * Set the movie genre.
	 *
	 * @param genre - The genre string.
	 */
	setMovieGenre(genre: string) {
		this.genre = genre;
	}

	/**
	 * Set the movie rating. Coerces string values to number.
	 * No-ops if the value is null or undefined.
	 *
	 * @param rate - The rating value.
	 */
	setMovieRate(rate: number) {
		if (rate === null || rate === undefined) return;
		this.rate = typeof rate === 'string' ? Number(rate) : rate;
	}

	/**
	 * Set the movie release year.
	 *
	 * @param year - The year.
	 */
	setMovieYear(year: number) {
		this.year = year;
	}

	/**
	 * Set the downloadable link for the movie cover image.
	 *
	 * @param coverImageDownloadableLink - The cover image URL.
	 */
	setMovieCoverImageDownloadableLink(coverImageDownloadableLink: string) {
		this.coverImageDownloadableLink = coverImageDownloadableLink;
	}

	/**
	 * Set the movie first release date.
	 *
	 * @param firstReleaseDate - The release date string.
	 */
	setMovieFirstReleaseDate(firstReleaseDate: string) {
		this.firstReleaseDate = firstReleaseDate;
	}

	/**
	 * Set the total number of episodes. Coerces string values to number.
	 *
	 * @param episodeNumber - The episode count.
	 */
	setMovieEpisodeNumber(episodeNumber: number) {
		this.episodeNumber = typeof episodeNumber === 'string' ? Number(episodeNumber) : episodeNumber;
	}

	/**
	 * Set the database key of the movie document.
	 *
	 * @param movieKey - The document key.
	 */
	setMovieKey(movieKey: string) {
		this.movieKey = movieKey;
	}

	/**
	 * Set the cover image Blob.
	 *
	 * @param coverImage - The cover image Blob.
	 */
	public setMovieCoverImage(coverImage: Blob | null) {
		this.coverImage = coverImage;
	}

	/**
	 * Set the session ID for rate search tracking.
	 *
	 * @param sessionId - The session ID.
	 */
	setSessionId(sessionId: number) {
		this.sessionId = sessionId;
	}

	/**
	 * Set whether the movie is a favourite. Falls back to false if null/undefined.
	 *
	 * @param isFavourite - The favourite flag.
	 */
	setIsFavourite(isFavourite: boolean) {
		this.isFavourite = isFavourite ?? false;
	}

	/**
	 * Set the movie description.
	 *
	 * @param description - The description string.
	 */
	setDescription(description: string) {
		this.description = description;
	}

	/**
	 * Set the movie actors list.
	 *
	 * @param actors - The actors string.
	 */
	setActors(actors: string) {
		this.actors = actors;
	}

	/**
	 * Returns the CloudBase owner ID stored on the database document.
	 *
	 * @returns The owner openid string, or empty string if not set.
	 */
	getOpenId(): string {
		return this.openid;
	}

	/**
	 * Sets the CloudBase owner ID from the database document.
	 *
	 * @param openid - The _openid field value from the CloudBase document.
	 */
	setOpenId(openid: string) {
		this.openid = openid;
	}
}
