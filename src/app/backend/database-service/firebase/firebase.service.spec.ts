import { TestBed } from '@angular/core/testing';

import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
	it('should be created', () => {
		// FirebaseService requires live Firebase providers (Storage, Database) that cannot
		// be unit-tested without a Firebase emulator.  Covered by integration tests.
		pending('requires Firebase integration');
	});
});
