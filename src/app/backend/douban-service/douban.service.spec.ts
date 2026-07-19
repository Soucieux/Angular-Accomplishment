import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DoubanService, MovieDetails } from './douban.service';
import { ENT_MOVIE_RATE_PROXY_URL } from '../../common/constants';

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

	// ── searchMovieDetails ─────────────────────────────────────────────────

	describe('searchMovieDetails', () => {
		it('calls the rate proxy with the movie ID', () => {
			service.searchMovieDetails(35465012).subscribe();

			const req = httpMock.expectOne(r => r.url.includes(ENT_MOVIE_RATE_PROXY_URL));
			expect(req.request.method).toBe('GET');
			expect(req.request.urlWithParams).toContain('35465012');
			req.flush({ rate: -1, releaseDate: '' });
		});

		it('passes the rating and release date through unchanged', () => {
			let received: MovieDetails | undefined;
			service.searchMovieDetails(35465012).subscribe(details => (received = details));

			const req = httpMock.expectOne(r => r.url.includes(ENT_MOVIE_RATE_PROXY_URL));
			req.flush({ rate: 6.6, releaseDate: '2026-06-11' });

			expect(received).toEqual({ rate: 6.6, releaseDate: '2026-06-11' });
		});

		it('propagates the error when the proxy fails', () => {
			let failed = false;
			service.searchMovieDetails(35465012).subscribe({ error: () => (failed = true) });

			const req = httpMock.expectOne(r => r.url.includes(ENT_MOVIE_RATE_PROXY_URL));
			req.flush('Rate lookup failed', { status: 502, statusText: 'Bad Gateway' });

			expect(failed).toBeTrue();
		});
	});
});
