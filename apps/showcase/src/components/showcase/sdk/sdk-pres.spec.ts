import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdkPresComponent } from './sdk-pres.component';

describe('SdkPresComponent', () => {
  let component: SdkPresComponent;
  let fixture: ComponentFixture<SdkPresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdkPresComponent]
    });
    fixture = TestBed.createComponent(SdkPresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
