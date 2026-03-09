import { Component } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { LOG } from '../../common/app.logs';
import { COMPONENT_DESTROY } from '../../common/app.utilities';

@Component({
	selector: 'home',
	standalone: true,
	imports: [MatRadioModule],
	templateUrl: './home.component.html',
	styleUrl: './home.component.css'
})
export class HomeComponent {
	private readonly className = 'HomeComponent';
	/**
	 * Anything that needs to be done when the component is destroyed.
	 */
	ngOnDestroy() {
		LOG.info(this.className, COMPONENT_DESTROY);
	}
}
