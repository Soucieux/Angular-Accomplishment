import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'recipe-paginator',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './recipe-paginator.component.html',
	styleUrls: ['./recipe-paginator.component.css']
})
export class RecipePaginatorComponent {
	/** Current page, 0-indexed. */
	@Input() page = 0;

	/** Explicit number of pages. When omitted, derived from totalItems / perPage. */
	@Input() pageCount?: number;

	/** Total item count; used with perPage to derive pageCount when pageCount is not set. */
	@Input() totalItems?: number;

	/** Items per page for count derivation when pageCount is omitted. */
	@Input() perPage = 8;

	/** Accessible label for the nav landmark. */
	@Input() ariaLabel = 'Pagination';

	/** Emits the new 0-indexed page when the user navigates. */
	@Output() pageChange = new EventEmitter<number>();

	/**
	 * Gets the resolved page count, derived from either pageCount or totalItems / perPage.
	 * Never returns less than 1.
	 *
	 * @returns The total number of pages.
	 */
	protected get count(): number {
		if (this.pageCount != null) return Math.max(1, this.pageCount);
		if (this.totalItems != null) return Math.max(1, Math.ceil(this.totalItems / this.perPage));
		return 1;
	}

	/**
	 * Gets the current page clamped to the valid range [0, count - 1].
	 *
	 * @returns The clamped current page index.
	 */
	protected get current(): number {
		return Math.min(Math.max(this.page, 0), this.count - 1);
	}

	/**
	 * Gets the ordered list of page indices for the segment track.
	 *
	 * @returns An array of 0-based page indices.
	 */
	protected get pages(): number[] {
		return Array.from({ length: this.count }, (_, i) => i);
	}

	/**
	 * Navigates to the given page index if it differs from the current one
	 * and falls within the valid range.
	 *
	 * @param targetPage - The 0-indexed destination page.
	 */
	protected go(targetPage: number): void {
		const next = Math.min(Math.max(targetPage, 0), this.count - 1);
		if (next !== this.current) this.pageChange.emit(next);
	}

	/**
	 * Navigates to the page immediately before the current one.
	 */
	protected prev(): void {
		this.go(this.current - 1);
	}

	/**
	 * Navigates to the page immediately after the current one.
	 */
	protected next(): void {
		this.go(this.current + 1);
	}
}
