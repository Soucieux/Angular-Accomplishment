import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DoubanService } from './douban.service';

describe('DoubanService', () => {
	let service: DoubanService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule]
		});
		service = TestBed.inject(DoubanService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	// ── searchMovieJSON ────────────────────────────────────────────────────

	describe('searchMovieJSON', () => {
		it('makes a GET request to a Cloud Function thread URL', () => {
			service.searchMovieJSON('Inception').subscribe();

			const requests = httpMock.match(r => r.url.includes('thread') && r.url.includes('a.run.app'));
			expect(requests.length).toBe(1);
			expect(requests[0].request.method).toBe('GET');
			requests[0].flush({});
		});

		it('includes the movie name in the request URL', () => {
			service.searchMovieJSON('Inception').subscribe();

			const req = httpMock.expectOne(r => r.url.includes('Inception'));
			expect(req.request.url).toContain('Inception');
			req.flush({});
		});
	});

	// ── searchMovieCover ───────────────────────────────────────────────────

	describe('searchMovieCover', () => {
		it('uses blob as the response type', () => {
			service.searchMovieCover('https://img.douban.com/cover.jpg', 'Inception').subscribe();

			const req = httpMock.expectOne(r => r.url.includes('thread') && r.url.includes('a.run.app'));
			expect(req.request.responseType).toBe('blob');
			req.flush(new Blob());
		});
	});

	// ── searchMovieByWebpage ───────────────────────────────────────────────

	describe('searchMovieByWebpage', () => {
		it('uses text as the response type', () => {
			service.searchMovieByWebpage(1234567).subscribe();

			const req = httpMock.expectOne(r => r.url.includes('thread') && r.url.includes('a.run.app'));
			expect(req.request.responseType).toBe('text');
			req.flush('<html></html>');
		});
	});

	// ── searchMovieByThirdPartyApi ─────────────────────────────────────────

	describe('searchMovieByThirdPartyApi', () => {
		it('makes a GET request to a Cloud Function thread URL', () => {
			service.searchMovieByThirdPartyApi(9876543).subscribe();

			const req = httpMock.expectOne(r => r.url.includes('thread') && r.url.includes('a.run.app'));
			expect(req.request.method).toBe('GET');
			req.flush('{}');
		});

		it('includes the movie ID in the request URL', () => {
			service.searchMovieByThirdPartyApi(9876543).subscribe();

			const req = httpMock.expectOne(r => r.url.includes('9876543'));
			expect(req.request.url).toContain('9876543');
			req.flush('{}');
		});

		it('uses text as the response type', () => {
			service.searchMovieByThirdPartyApi(9876543).subscribe();

			const req = httpMock.expectOne(r => r.url.includes('thread') && r.url.includes('a.run.app'));
			expect(req.request.responseType).toBe('text');
			req.flush('{}');
		});
	});
});
