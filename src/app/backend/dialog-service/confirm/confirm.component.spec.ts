import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm.component';

describe('ConfirmDialogComponent', () => {
    let component: ConfirmDialogComponent;
    let fixture: ComponentFixture<ConfirmDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfirmDialogComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // ── openDialog ─────────────────────────────────────────────────────────

    describe('openDialog', () => {
        it('sets message, header, and acceptLabel from the data array', () => {
            component.openDialog(async () => {}, ['Are you sure?', 'Confirm Action', 'Delete']);

            expect((component as any).message).toBe('Are you sure?');
            expect((component as any).header).toBe('Confirm Action');
            expect((component as any).acceptLabel).toBe('Delete');
        });

        it('makes the dialog visible', () => {
            component.openDialog(async () => {}, ['msg', 'header', 'OK']);

            expect((component as any).visible).toBeTrue();
        });
    });

    // ── onAccept ───────────────────────────────────────────────────────────

    describe('onAccept', () => {
        it('calls the acceptCallback', async () => {
            let accepted = false;
            const cb = async () => {
                accepted = true;
            };
            component.openDialog(cb, ['msg', 'header', 'OK']);

            await (component as any).onAccept();

            expect(accepted).toBeTrue();
        });

		it('closes the dialog after the callback resolves', async () => {
            component.openDialog(async () => {}, ['msg', 'header', 'OK']);

            await (component as any).onAccept();

			expect((component as any).visible).toBeFalse();
		});

		it('keeps the dialog open when the callback rejects', async () => {
			const writeError = new Error('write failed');
			component.openDialog(() => Promise.reject(writeError), ['msg', 'header', 'OK']);

			await expectAsync((component as any).onAccept()).toBeRejectedWith(writeError);

			expect((component as any).visible).toBeTrue();
		});
	});

    // ── onReject ───────────────────────────────────────────────────────────

    describe('onReject', () => {
        it('closes the dialog without calling the acceptCallback', () => {
            let accepted = false;
            const cb = async () => {
                accepted = true;
            };
            component.openDialog(cb, ['msg', 'header', 'OK']);

            (component as any).onReject();

            expect(accepted).toBeFalse();
            expect((component as any).visible).toBeFalse();
        });
    });

    // ── onDialogClosed ─────────────────────────────────────────────────────

    describe('onDialogClosed', () => {
        it('emits the closed$ event', () => {
            let emitted = false;
            component.closed$.subscribe(() => (emitted = true));
            (component as any).onDialogClosed();
            expect(emitted).toBeTrue();
        });

        it('emits void (no value carried)', () => {
            let emittedValue: unknown = 'sentinel';
            component.closed$.subscribe((v) => (emittedValue = v));
            (component as any).onDialogClosed();
            expect(emittedValue).toBeUndefined();
        });
    });

    // ── focusAcceptButton ──────────────────────────────────────────────────

    describe('focusAcceptButton', () => {
        it('does not throw when the accept button ref is not yet available', () => {
            expect(() => (component as any).focusAcceptButton()).not.toThrow();
        });
    });

    // ── closed$ EventEmitter ────────────────────────────────────────────────

    describe('closed$', () => {
        it('is defined as an EventEmitter', () => {
            expect(component.closed$).toBeDefined();
        });
    });
});
