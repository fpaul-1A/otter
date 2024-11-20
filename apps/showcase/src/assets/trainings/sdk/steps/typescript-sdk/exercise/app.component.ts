import { Component, inject, signal } from '@angular/core';
import { PetApi } from '../../../../libs/sdk/src/api';
import type { Pet } from '../../../../libs/sdk/src/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /** Title of the application */
  public title = 'tutorial-app';

  private readonly petStoreApi = inject(PetApi);
  public pets = signal<Pet[]>([]);

  constructor() {
    this.setPets();
  }

  public setPets() {
    /* Get the first 10 pets whose status is 'available' */
  }
}
