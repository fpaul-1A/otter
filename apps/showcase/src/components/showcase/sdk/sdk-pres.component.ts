import { PetApi, Tag } from '@ama-sdk/showcase-sdk';
import type { Pet } from '@ama-sdk/showcase-sdk';
import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbHighlight, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { O3rComponent } from '@o3r/core';

@O3rComponent({ componentType: 'Component' })
@Component({
  selector: 'o3r-sdk-pres',
  standalone: true,
  imports: [CommonModule, NgbHighlight, FormsModule, NgbPagination],
  templateUrl: './sdk-pres.template.html',
  styleUrls: ['./sdk-pres.style.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SdkPresComponent {
  private petStoreApi = inject(PetApi);

  public name = '';

  public searchTerm = signal('');

  public pageSize = signal(10);

  public page = signal(1);

  public pets = signal<Pet[]>([]);

  public loading = signal(true);

  public filteredPets = computed(() => {
    let pets = this.pets();
    if (this.searchTerm()) {
      const matchString = new RegExp(this.searchTerm().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const matchTag = (tag: Tag) => tag.name && matchString.test(tag.name);
      pets = pets.filter((pet) =>
        (pet.id && matchString.test(String(pet.id))) ||
        matchString.test(pet.name) ||
        (pet.category?.name && matchString.test(pet.category.name)) ||
        (pet.tags && pet.tags.some(matchTag)));
    }
    return pets;
  });

  public total = computed(() => this.filteredPets().length);

  public displayedPets = computed(() =>
    this.filteredPets().slice((this.page() - 1) * this.pageSize(), (this.page()) * this.pageSize())
  );

  constructor() {
    void this.reload();
  }

  private getNextId() {
    return this.pets().reduce<number>((maxId, pet) => Math.max(maxId, pet.id || 0), 0) + 1;
  }

  public reload() {
    this.loading.set(true);
    return this.petStoreApi.findPetsByStatus({status: 'available'}).then((pets) => {
      this.pets.set(pets.sort((a, b) => a.id && b.id && a.id - b.id || 0));
      this.loading.set(false);
    });
  }

  public async create() {
    const pet: Pet = {
      id: this.getNextId(),
      name: this.name,
      category: {name: 'otter'},
      tags: [{name: 'otter'}],
      status: 'available',
      photoUrls: []
    };
    this.loading.set(true);
    await this.petStoreApi.addPet({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Pet: pet
    });
    await this.reload();
  }

  public async delete(petToDelete: Pet) {
    if (petToDelete.id) {
      this.loading.set(true);
      try {
        await this.petStoreApi.deletePet({petId: petToDelete.id});
      } catch (ex) {
        // The backend respond with incorrect header application/json while the response is just a string
      }
      await this.reload();
    }
  }

  public getTags(pet: Pet) {
    return pet.tags?.map((tag) => tag.name).join(',');
  }
}
