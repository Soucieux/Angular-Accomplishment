import { Routes } from '@angular/router';
import { AccountComponent } from './fontend/account/account.component';
import { accountGuard } from './fontend/account/account.guard';
import { EntertainmentComponent } from './fontend/entertainment/entertainment.component';
import { HomeComponent } from './fontend/home/home.component';
import { LoginComponent } from './fontend/login/login.component';
import { loginGuard } from './fontend/login/login.guard';
import { PatchComponent } from './fontend/patch/patch.component';
import { ReminderComponent } from './fontend/reminder/reminder.component';
import { AboutComponent } from './fontend/about/about.component';
import { ResonanceComponent } from './fontend/resonance/resonance.component';
import { PortalComponent } from './fontend/portal/portal.component';
import { RecipeComponent } from './fontend/recipe/recipe.component';
import { DebtComponent } from './fontend/debt/debt.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'entertainment', component: EntertainmentComponent },
	{ path: 'login', component: LoginComponent, canMatch: [loginGuard] },
	{ path: 'account', component: AccountComponent, canMatch: [accountGuard] },
	{ path: 'patch', component: PatchComponent },
	{ path: 'reminder', component: ReminderComponent },
	{ path: 'about', component: AboutComponent },
	{ path: 'resonance', component: ResonanceComponent },
	{ path: 'portal', component: PortalComponent },
	{ path: 'recipe', component: RecipeComponent },
	{ path: 'debt', component: DebtComponent }
];
