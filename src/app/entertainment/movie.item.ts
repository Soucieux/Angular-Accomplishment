interface MovieItemInterface {
	title: string;
	genre: string;
	rate: number;
	cover: string;
}
export class MovieItem implements MovieItemInterface {
	constructor(
		public title: string,
		public genre: string,
		public rate: number = -1,
		public cover: string = '',
		public id: number = -1
	) {}
}
