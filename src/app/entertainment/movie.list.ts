interface MovieItemInterface {
	title: string;
	category: string;
	rate: number;
	cover: string;
}
export class MovieItem implements MovieItemInterface {
	constructor(
		public title: string,
		public category: string,
		public rate: number = -1,
		public cover: string = '',
		public id: number = -1
	) {}
}
