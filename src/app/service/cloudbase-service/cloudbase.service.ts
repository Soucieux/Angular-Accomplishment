// cloudbase-init.service.ts
import { Injectable } from '@angular/core';
import cloudbase from '@cloudbase/js-sdk';
import { environment } from '../../../environment/environment';

@Injectable({ providedIn: 'root' })
export class CloudbaseService {
    private readonly className = 'CloudbaseService';
    public cloudbase: any;

    constructor() {
        if (this.cloudbase || typeof window === 'undefined') {
            return;
        }

        this.cloudbase = cloudbase.init({
            env: environment.cloudbase.envId,
            region: environment.cloudbase.region
        });
    }
}
