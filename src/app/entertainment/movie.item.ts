interface MovieItemInterface {
	title: string;
	genre: string;
	rate: number;
	coverId: number;
	id: number;
}
export class MovieItem implements MovieItemInterface {
	constructor(
		public title: string,
		public genre: string,
		public rate: number = -1,
		public coverId: number = -1,
		public id: number = -1
	) {}
}
