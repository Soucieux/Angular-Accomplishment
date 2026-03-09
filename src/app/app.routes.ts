import { Routes } from '@angular/router';
import { EntertainmentComponent } from './fontend/entertainment/entertainment.component';
import { HomeComponent } from './fontend/home/home.component';
import { LoginComponent } from './fontend/login/login.component';
import { loginGuard } from './fontend/login/login.guard';
import { PatchComponent } from './fontend/patch/patch.component';
import { RemainderComponent } from './fontend/remainder/remainder.component';
import { AboutComponent } from './fontend/about/about.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'entertainment', component: EntertainmentComponent },
	{ path: 'login', component: LoginComponent, canMatch: [loginGuard] },
	{ path: 'patch', component: PatchComponent },
	{ path: 'remainder', component: RemainderComponent },
	{ path: 'about', component: AboutComponent }
];
