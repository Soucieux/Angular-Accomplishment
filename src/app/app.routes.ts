import { Routes } from '@angular/router';
import { EntertainmentComponent } from './fontend/entertainment/entertainment.component';
import { HomeComponent } from './fontend/home/home.component';
import { LoginComponent } from './fontend/login/login.component';
import { loginGuard } from './fontend/login/login.guard';
import { PatchComponent } from './fontend/patch/patch.component';
import { ReminderComponent } from './fontend/reminder/reminder.component';
import { AboutComponent } from './fontend/about/about.component';
import { ResonanceComponent } from './fontend/resonance/resonance.component';
import { NexusComponent } from './fontend/nexus/nexus.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'entertainment', component: EntertainmentComponent },
	{ path: 'login', component: LoginComponent, canMatch: [loginGuard] },
	{ path: 'patch', component: PatchComponent },
	{ path: 'reminder', component: ReminderComponent },
	{ path: 'about', component: AboutComponent },
	{ path: 'resonance', component: ResonanceComponent },
	{ path: 'nexus', component: NexusComponent }
];
