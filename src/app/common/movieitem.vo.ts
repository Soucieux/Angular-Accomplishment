export class MovieItemVO {
	private id: number = -1;
	private genre: string = '';
	private rate: number = -1;
	private coverImageDownloadableLink: string = '';
	private firstReleaseDate: string = '';
	private episodeNumber: number = -1;
	private coverImage: any = null;
	private movieKey: string = '';
	private sessionId: number = -1;
	private isFavourite: boolean = false;
	private description: string = '';
	private actors: string = '';

	constructor();

	constructor(title: string, year: number);

	constructor(private title?: string, private year?: number) {
		if (this.year) {
			this.year = typeof year === 'string' ? Number(year) : year;
		}
	}

	getMovieName(): string {
		return this.title ? this.title : '';
	}

	getMovieId(): number {
		return this.id;
	}

	getMovieGenre(): string {
		return this.genre;
	}

	getMovieRate(): number {
		return this.rate;
	}

	getMovieCoverImageDownloadableLink(): string {
		return this.coverImageDownloadableLink;
	}

	getMovieYear(): number {
		return this.year ? this.year : -1;
	}

	getMovieFirstReleaseDate(): string {
		return this.firstReleaseDate;
	}

	getMovieEpisodeNumber(): number {
		return this.episodeNumber;
	}

	getMovieKey(): string {
		return this.movieKey;
	}

	getMovieCoverImage(): any {
		return this.coverImage;
	}

	getIsFavourite(): boolean {
		return this.isFavourite;
	}

	getSessionId(): number {
		return this.sessionId;
	}

	getDescription() {
		return this.description;
	}

	getActors() {
		return this.actors;
	}

	setMovieName(title: string) {
		this.title = title;
	}

	setMovieId(id: number) {
		this.id = typeof id === 'string' ? Number(id) : id;
	}

	setMovieGenre(genre: string) {
		this.genre = genre;
	}

	setMovieRate(rate: number) {
		this.rate = typeof rate === 'string' ? Number(rate) : rate;
	}

	setMovieYear(year: number) {
		this.year = year;
	}

	setMovieCoverImageDownloadableLink(coverImageDownloadableLink: string) {
		this.coverImageDownloadableLink = coverImageDownloadableLink;
	}

	setMovieFirstReleaseDate(firstReleaseDate: string) {
		this.firstReleaseDate = firstReleaseDate;
	}

	setMovieEpisodeNumber(episodeNumber: number) {
		this.episodeNumber = typeof episodeNumber === 'string' ? Number(episodeNumber) : episodeNumber;
	}

	setMovieKey(movieKey: string) {
		this.movieKey = movieKey;
	}

	setMovieCoverImage(coverImage: any) {
		this.coverImage = coverImage;
	}

	setSessionId(sessionId: number) {
		this.sessionId = sessionId;
	}

	setIsFavourite(isFavourite: boolean) {
		this.isFavourite = isFavourite ?? false;
	}

	setDescription(description: string) {
		this.description = description;
	}

	setActors(actors: string) {
		this.actors = actors;
	}
}
