import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { DatabaseService } from '../../backend/database-service/database.service';
import { DialogService } from '../../backend/dialog-service/dialog.service';
import { Utilities } from '../../common/utilities/app.utilities';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;
	let mockDb: jasmine.SpyObj<DatabaseService>;
	let mockDialogService: jasmine.SpyObj<DialogService>;
	let mockUtilities: jasmine.SpyObj<Utilities>;

	beforeEach(async () => {
		mockDb = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
			'getCombinedStats',
			'getLinkCategories',
			'getUsefulLinks'
		]);
		mockDb.getCombinedStats.and.returnValue(of(null));
		mockDb.getLinkCategories.and.returnValue(of([]));
		mockDb.getUsefulLinks.and.returnValue(of([]));

		mockDialogService = jasmine.createSpyObj<DialogService>('DialogService', ['showLoadingTimeout']);

		mockUtilities = jasmine.createSpyObj<Utilities>('Utilities', [
			'getIsUserAlive$',
			'getIsUserAlive',
			'checkIfChinese',
			'checkIfHoverCapable'
		]);
		// Logged-out so ngOnInit does not start the dashboard data subscriptions.
		mockUtilities.getIsUserAlive$.and.returnValue(of(false));
		mockUtilities.getIsUserAlive.and.returnValue(false);
		mockUtilities.checkIfChinese.and.returnValue(false);

		await TestBed.configureTestingModule({
			imports: [HomeComponent],
			providers: [
				MessageService,
				{ provide: DatabaseService, useValue: mockDb },
				{ provide: DialogService, useValue: mockDialogService },
				{ provide: Utilities, useValue: mockUtilities }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HomeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
