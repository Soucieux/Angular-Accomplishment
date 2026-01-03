import { Routes } from '@angular/router';
import { EntertainmentComponent } from './entertainment/entertainment.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { loginGuard } from './login/login.guard';
import { PatchComponent } from './patch/patch.component';
import { RemainderComponent } from './remainder/remainder.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'entertainment', component: EntertainmentComponent },
	{ path: 'login', component: LoginComponent, canMatch: [loginGuard] },
    { path: 'patch', component: PatchComponent },
    { path: 'remainder', component: RemainderComponent }
];
