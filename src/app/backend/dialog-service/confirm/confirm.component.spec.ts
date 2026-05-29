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
        it('calls confirmationService.confirm with the correct message and header', () => {
            const confirmSpy = spyOn((component as any).confirmationService, 'confirm');
            const cb = async () => {};
            component.openDialog(cb, ['Are you sure?', 'Confirm Action', 'Delete']);

            expect(confirmSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({ message: 'Are you sure?', header: 'Confirm Action' })
            );
        });

        it('passes the acceptButtonProps label from data[2]', () => {
            const confirmSpy = spyOn((component as any).confirmationService, 'confirm');
            component.openDialog(async () => {}, ['msg', 'header', 'Remove Item']);

            expect(confirmSpy).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    acceptButtonProps: jasmine.objectContaining({ label: 'Remove Item' })
                })
            );
        });

        it('calls the acceptCallback when the accept handler is invoked', async () => {
            let accepted = false;
            const cb = async () => { accepted = true; };
            let capturedConfig: any;
            spyOn((component as any).confirmationService, 'confirm').and.callFake((config: any) => {
                capturedConfig = config;
            });

            component.openDialog(cb, ['msg', 'header', 'OK']);
            await capturedConfig.accept();
            expect(accepted).toBeTrue();
        });

        it('sets closable to false', () => {
            let capturedConfig: any;
            spyOn((component as any).confirmationService, 'confirm').and.callFake((config: any) => {
                capturedConfig = config;
            });
            component.openDialog(async () => {}, ['msg', 'header', 'OK']);
            expect(capturedConfig.closable).toBeFalse();
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

    // ── closed$ EventEmitter ────────────────────────────────────────────────

    describe('closed$', () => {
        it('is defined as an EventEmitter', () => {
            expect(component.closed$).toBeDefined();
        });
    });
});
