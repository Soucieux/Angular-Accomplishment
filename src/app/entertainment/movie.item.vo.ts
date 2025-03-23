export class MovieItemVO {
	private id: number = -1;
	private genre: string = '';
	private rate: number = -1;
	private coverImageLink: string = '';
	private firstReleaseDate: string = '';
	private episodeNumber: number = -1;
	constructor(private title: string, private year: number, private movieKey: string, public isMovieIdAlreadyExist: boolean) {}

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

	getMovieEpisodeNumber(): number {
		return this.episodeNumber;
    }

	getMovieKey(): string {
		return this.movieKey;
	}

	setMovieId(id: number) {
		this.id = Number(id);
	}

	setMovieGenre(genre: string) {
		this.genre = genre;
	}

	setMovieRate(rate: number) {
		this.rate = Number(rate);
	}

	setMovieCoverImageLink(coverImageLink: string) {
		this.coverImageLink = coverImageLink;
	}

	setMovieFirstReleaseDate(firstReleaseDate: string) {
		this.firstReleaseDate = firstReleaseDate;
	}

	setMovieEpisodeNumber(episodeNumber: number) {
		this.episodeNumber = Number(episodeNumber);
	}
}
