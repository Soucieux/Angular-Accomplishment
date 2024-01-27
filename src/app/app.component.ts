import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: '<button class="btn btn-primary">Save</button>',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'My-Own-Website';
}
