import { Component, inject } from '@angular/core';
import { RouterOutlet, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ToastOutletComponent } from './shared/components/toast-outlet/toast-outlet.component';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastOutletComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  private hasLandingLayout(route: ActivatedRouteSnapshot | null): boolean {
    if (!route) return false;

    if (route.data['hideSidebar'] || route.data['layout'] === 'landing') {
      return true;
    }

    return this.hasLandingLayout(route.firstChild);
  }

  /** True when the active route has data.hideSidebar = true or layout = landing */
  readonly isLandingLayout = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.hasLandingLayout(this.router.routerState.snapshot.root)),
    ),
    { initialValue: false },
  );
}
