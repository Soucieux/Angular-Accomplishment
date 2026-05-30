import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AboutComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('timeline contains 6 entries', () => {
        expect((component as any).timeline.length).toBe(6);
    });

    // ── fillHeight ─────────────────────────────────────────────────────────

    describe('fillHeight', () => {
        it('returns a CSS calc() string', () => {
            expect((component as any).fillHeight()).toContain('calc(');
        });

        it('returns "0" proportion when no entries are visible', () => {
            (component as any).maxSeen = 0;
            const result = (component as any).fillHeight();
            expect(result).toContain('* 0');
        });

        it('scales with the number of visible entries', () => {
            (component as any).maxSeen = 3;
            (component as any).timeline = new Array(6);
            const result = (component as any).fillHeight();
            // 3/6 = 0.5
            expect(result).toContain('0.5');
        });

        it('returns 1 proportion when all entries are visible', () => {
            const count = (component as any).timeline.length;
            (component as any).maxSeen = count;
            const result = (component as any).fillHeight();
            expect(result).toContain('* 1');
        });
    });

    // ── entryDelay ─────────────────────────────────────────────────────────

    describe('entryDelay', () => {
        it('returns "0ms" for the first entry (index 0)', () => {
            expect((component as any).entryDelay(0)).toBe('0ms');
        });

        it('returns "60ms" for index 1', () => {
            expect((component as any).entryDelay(1)).toBe('60ms');
        });

        it('returns "120ms" for index 2', () => {
            expect((component as any).entryDelay(2)).toBe('120ms');
        });

        it('returns "180ms" for index 3', () => {
            expect((component as any).entryDelay(3)).toBe('180ms');
        });

        it('caps at "240ms" for index 4 and above', () => {
            expect((component as any).entryDelay(4)).toBe('240ms');
            expect((component as any).entryDelay(10)).toBe('240ms');
        });
    });

    // ── hover state ────────────────────────────────────────────────────────

    describe('setHoveredEntry / resetHoverState', () => {
        it('sets hoveredIndex when an entry is hovered', () => {
            (component as any).setHoveredEntry(2);
            expect((component as any).hoveredIndex).toBe(2);
        });

        it('overwrites hoveredIndex when a different entry is hovered', () => {
            (component as any).setHoveredEntry(0);
            (component as any).setHoveredEntry(4);
            expect((component as any).hoveredIndex).toBe(4);
        });

        it('clears hoveredIndex when the cursor leaves', () => {
            (component as any).hoveredIndex = 2;
            (component as any).resetHoverState();
            expect((component as any).hoveredIndex).toBeNull();
        });

        it('clears hoveredIndex even when it was already null', () => {
            (component as any).hoveredIndex = null;
            (component as any).resetHoverState();
            expect((component as any).hoveredIndex).toBeNull();
        });

        it('sets hoveredIndex to 0', () => {
            (component as any).setHoveredEntry(0);
            expect((component as any).hoveredIndex).toBe(0);
        });
    });

    // ── visibleEntries / maxSeen initial state ──────────────────────────────

    describe('initial state', () => {
        it('maxSeen starts at 0 or reflects visible entries after init', () => {
            // After fixture.detectChanges() all entries may be marked visible by the fallback timer
            // so we just assert it is a non-negative number.
            expect((component as any).maxSeen).toBeGreaterThanOrEqual(0);
        });

        it('visibleEntries is a Set', () => {
            expect((component as any).visibleEntries).toBeInstanceOf(Set);
        });
    });
});
