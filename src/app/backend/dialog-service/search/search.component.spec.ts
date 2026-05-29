import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { SearchStreamService } from './search-stream.service';
import { SearchDialogComponent } from './search.component';
import { SEARCH_CANCEL, SEARCH_COMPLETE } from '../../../common/app.constant';

describe('SearchComponent', () => {
    let component: SearchDialogComponent;
    let fixture: ComponentFixture<SearchDialogComponent>;
    let mockSearchStream: jasmine.SpyObj<SearchStreamService>;
    let fakeSearchLogs$: Subject<string[]>;

    beforeEach(async () => {
        fakeSearchLogs$ = new Subject<string[]>();

        mockSearchStream = jasmine.createSpyObj<SearchStreamService>('SearchStreamService', [
            'clearSearchLogs',
            'addSearchLog'
        ]);
        Object.defineProperty(mockSearchStream, 'searchLogs$', {
            get: () => fakeSearchLogs$.asObservable()
        });
        mockSearchStream.clearSearchLogs.and.stub();

        await TestBed.configureTestingModule({
            imports: [SearchDialogComponent],
            providers: [{ provide: SearchStreamService, useValue: mockSearchStream }]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ── openDialog ─────────────────────────────────────────────────────────

    describe('openDialog', () => {
        it('sets visible to true', () => {
            const stopCb = jasmine.createSpy('stop');
            component.openDialog(stopCb);
            expect((component as any).visible).toBeTrue();
        });

        it('stores the stop callback', () => {
            const stopCb = jasmine.createSpy('stop');
            component.openDialog(stopCb);
            expect((component as any).stopCallback).toBe(stopCb);
        });

        it('populates searchLogs when the stream emits', () => {
            component.openDialog(() => {});
            fakeSearchLogs$.next(['log 1', 'log 2']);
            expect((component as any).searchLogs).toEqual(['log 1', 'log 2']);
        });

        it('sets searchCompleteOrInterrupted to true when SEARCH_COMPLETE is the last log', () => {
            component.openDialog(() => {});
            fakeSearchLogs$.next(['starting...', SEARCH_COMPLETE]);
            expect((component as any).searchCompleteOrInterrupted).toBeTrue();
        });

        it('sets searchCompleteOrInterrupted to true when SEARCH_CANCEL is the last log', () => {
            component.openDialog(() => {});
            fakeSearchLogs$.next(['starting...', SEARCH_CANCEL]);
            expect((component as any).searchCompleteOrInterrupted).toBeTrue();
        });

        it('does not set searchCompleteOrInterrupted when the last log is a regular entry', () => {
            component.openDialog(() => {});
            fakeSearchLogs$.next(['processing item 1']);
            expect((component as any).searchCompleteOrInterrupted).toBeFalse();
        });
    });

    // ── triggerStopSearching ───────────────────────────────────────────────

    describe('triggerStopSearching', () => {
        it('invokes the stop callback', () => {
            const stopCb = jasmine.createSpy('stop');
            component.openDialog(stopCb);
            (component as any).triggerStopSearching();
            expect(stopCb).toHaveBeenCalled();
        });

        it('does not throw when no stop callback is set', () => {
            expect(() => (component as any).triggerStopSearching()).not.toThrow();
        });
    });

    // ── onDialogClosed ─────────────────────────────────────────────────────

    describe('onDialogClosed', () => {
        it('emits the closed$ event', () => {
            let emitted = false;
            component.closed$.subscribe(() => (emitted = true));
            component.openDialog(() => {});
            (component as any).onDialogClosed();
            expect(emitted).toBeTrue();
        });

        it('sets visible to false', () => {
            component.openDialog(() => {});
            (component as any).visible = true;
            (component as any).onDialogClosed();
            expect((component as any).visible).toBeFalse();
        });

        it('resets searchCompleteOrInterrupted to false', () => {
            component.openDialog(() => {});
            (component as any).searchCompleteOrInterrupted = true;
            (component as any).onDialogClosed();
            expect((component as any).searchCompleteOrInterrupted).toBeFalse();
        });

        it('calls clearSearchLogs on the stream service', () => {
            component.openDialog(() => {});
            (component as any).onDialogClosed();
            expect(mockSearchStream.clearSearchLogs).toHaveBeenCalled();
        });
    });

    // ── closed$ initial state ──────────────────────────────────────────────

    describe('closed$', () => {
        it('is defined as an output', () => {
            expect(component.closed$).toBeDefined();
        });
    });

    // ── visible initial state ──────────────────────────────────────────────

    describe('initial state', () => {
        it('starts with visible = false', () => {
            expect((component as any).visible).toBeFalse();
        });

        it('starts with searchCompleteOrInterrupted = false', () => {
            expect((component as any).searchCompleteOrInterrupted).toBeFalse();
        });

        it('starts with an empty searchLogs array', () => {
            expect((component as any).searchLogs).toEqual([]);
        });
    });
});
