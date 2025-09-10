export class MovieItemVO {
	private id: number = -1;
	private genre: string = '';
	private rate: number = -1;
	private year: number = -1;
	private coverImageDownloadableLink: string = '';
	private firstReleaseDate: string = '';
	private episodeNumber: number = -1;
	private coverImage: any = null;

	constructor(private title: string, year: number, private movieKey: string) {
		this.year = typeof year === 'string' ? Number(year) : year;
	}

	getMovieTitle(): string {
		return this.title;
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
		return this.year;
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

	setMovieId(id: number) {
		this.id = typeof id === 'string' ? Number(id) : id;
	}

	setMovieGenre(genre: string) {
		this.genre = genre;
	}

	setMovieRate(rate: number) {
		this.rate = typeof rate === 'string' ? Number(rate) : rate;
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

	setMovieCoverImage(coverImage: any) {
		this.coverImage = coverImage;
	}
}
