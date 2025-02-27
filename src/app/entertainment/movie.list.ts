interface MovieItemInterface {
	name: string;
	category: string;
	rate: number;
	cover: string;
}
export class MovieItem implements MovieItemInterface {
	constructor(
		public name: string,
		public category: string,
		public rate: number = -1,
        public cover: string = '',
        public id: number = -1,
	) {}
}
export var movies: MovieItem[] = [
	new MovieItem('无证之罪', '悬疑'),
	new MovieItem('沙海', '悬疑'),
	new MovieItem('长安十二时辰', '悬疑'),
	new MovieItem('谁是被害者 第一季', '悬疑'),
	new MovieItem('沉默的真相', '悬疑'),
	new MovieItem('终极笔记', '悬疑'),
	new MovieItem('御赐小仵作', '悬疑'),
	new MovieItem('猎罪图鉴', '悬疑'),
	new MovieItem('亲爱的小孩', '悬疑'),
	new MovieItem('异物志', '悬疑'),
	new MovieItem('风起陇西', '悬疑'),
	new MovieItem('她和她的她', '悬疑'),
	new MovieItem('三体', '悬疑'),
	new MovieItem('谁是被害者 第二季', '悬疑'),
	new MovieItem('白夜破晓', '悬疑'),
	new MovieItem('猎罪图鉴2', '悬疑')
];
