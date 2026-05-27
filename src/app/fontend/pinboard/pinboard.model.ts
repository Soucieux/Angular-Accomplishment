export interface PinboardItem {
	key: string;
	_openid: string;
	text: string;
	date: string | null;
	link: string | null;
	tags: string[];
}
