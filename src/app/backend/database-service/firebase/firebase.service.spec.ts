import { DatabaseService } from '../database.service';
import { FirebaseService } from './firebase.service';

describe('FirebaseService', () => {
    // FirebaseService requires live Firebase providers (Storage, Database, EnvironmentInjector)
    // that cannot be unit-tested without a Firebase emulator.
    // The service is no longer actively maintained — CloudbaseService is the current backend.

    it('extends DatabaseService', () => {
        expect(FirebaseService.prototype instanceof DatabaseService).toBeTrue();
    });
});
