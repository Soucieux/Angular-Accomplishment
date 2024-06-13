import { Component } from '@angular/core';
import { CdkMenuModule } from '@angular/cdk/menu';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CdkMenuModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
