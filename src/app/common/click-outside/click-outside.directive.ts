import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

/**
 * Emits when a document-level click lands outside the host element. Attach to the wrapping element
 * of a dropdown, popover, or panel that should close when the user clicks elsewhere — replaces the
 * `@HostListener('document:click')` + manual `ElementRef.contains()` check every such panel needs.
 */
@Directive({
	selector: '[clickOutside]',
	standalone: true
})
export class ClickOutsideDirective {
	@Output() readonly clickOutside = new EventEmitter<Event>();

	constructor(private elementRef: ElementRef<HTMLElement>) {}

	/**
	 * Emits {@link clickOutside} when the click target falls outside this directive's host element.
	 *
	 * @param event - The document-level click event.
	 */
	@HostListener('document:click', ['$event'])
	protected onDocumentClick(event: Event): void {
		if (!this.elementRef.nativeElement.contains(event.target as Node)) {
			this.clickOutside.emit(event);
		}
	}
}
