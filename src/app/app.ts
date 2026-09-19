import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ToastOutletComponent } from './shared/components/toast-outlet/toast-outlet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastOutletComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
