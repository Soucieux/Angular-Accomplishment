// Remember to update the attributes here when the attributes in the firebase are changed
interface MovieItemInterface {
	title: string;
	genre: string;
	rate: number;
	coverImageLink: string;
	id: number;
}
export class MovieItem implements MovieItemInterface {
	constructor(
		public title: string,
		public genre: string,
		public rate: number = -1,
		public coverImageLink: string,
		public id: number = -1
	) {}
}
