/** Shape of the form value submitted by the add-movie dialog. */
export interface AddMovieFormValue {
	movieName?: string;
	id?: string;
	years?: string;
	genres?: { genre: string };
}
