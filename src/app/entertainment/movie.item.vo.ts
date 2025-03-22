// Remember to update the attributes here when the attributes in the firebase are changed
export class MovieItemVO {
	private id: number = -1;
	private genre: string = '';
	private rate: number = -1;
	private coverImageLink: string = '';
	private year: number = -1;
	private firstReleaseDate: string = '';
	private episodeNumber: string = '';
	constructor(public title: string) {}

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

	getMovieCoverImageLink(): string {
		return this.coverImageLink;
	}

	getMovieYear(): number {
		return this.year;
	}

	getMovieFirstReleaseDate(): string {
		return this.firstReleaseDate;
	}

	getMovieEpisodeNumber(): string {
		return this.episodeNumber;
	}

	setMovieId(id: number) {
		this.id = id;
	}

	setMovieGenre(genre: string) {
		this.genre = genre;
	}

	setMovieRate(rate: number) {
		this.rate = rate;
	}

	setMovieCoverImageLink(coverImageLink: string) {
		this.coverImageLink = coverImageLink;
	}

	setMovieYear(year: number) {
		this.year = year;
	}

	setMovieFirstReleaseDate(firstReleaseDate: string) {
		this.firstReleaseDate = firstReleaseDate;
	}

	setMovieEpisodeNumber(episodeNumber: string) {
		this.episodeNumber = episodeNumber;
	}

	isMovieIdAlreadyExist(): boolean {
		return this.id !== -1;
	}

	isMovieCoverImageExist(): boolean {
		return this.coverImageLink !== '';
	}

	isMovieFirstReleaseDateExist(): boolean {
		return this.firstReleaseDate !== '';
	}

	isMovieEpisodeNumberExist(): boolean {
		return this.episodeNumber !== '';
	}
}
