import { Component, inject, signal } from '@angular/core';
import { ApiFactoryService } from '@o3r/apis-manager';
import { type Pet, PetApi, StoreApi } from 'sdk';

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

  /* Inject the ApiFactoryService and get the corresponding APIs */
  private petApi;
  private storeApi;

  private readonly petsWritable = signal<Pet[]>([]);
  public readonly pets = this.petsWritable.asReadonly();

  private readonly petsInventoryWritable = signal<{ [key: string]: number }>({});
  public readonly petsInventory = this.petsInventoryWritable.asReadonly();

  public async getAvailablePets() {
    /* Get the pets whose status is 'available' */
  }

  public async getPetInventory() {
    /* Get the pets inventory */
  }
}
