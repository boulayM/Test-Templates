import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Address } from '../../../shared/models/address.model';
import { User } from '../../../shared/models/user.model';

type AddressFormValue = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
  isDefault: boolean;
};

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  addresses = signal<Address[]>([]);
  editingAddressId = signal<number | null>(null);

  readonly createAddressForm = this.fb.nonNullable.group({
    label: ['', [Validators.required]],
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    line1: ['', [Validators.required]],
    line2: [''],
    postalCode: ['', [Validators.required]],
    city: ['', [Validators.required]],
    country: ['', [Validators.required]],
    isDefault: [false],
  });

  readonly editAddressForm = this.fb.nonNullable.group({
    label: ['', [Validators.required]],
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    line1: ['', [Validators.required]],
    line2: [''],
    postalCode: ['', [Validators.required]],
    city: ['', [Validators.required]],
    country: ['', [Validators.required]],
    isDefault: [false],
  });

  constructor(
    private auth: AuthService,
    private addressesService: AddressService,
    private toast: ToastService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((u) => {
      this.user.set(u);
    });
    this.loadAddresses();
  }

  startEdit(address: Address): void {
    this.editingAddressId.set(address.id);
    this.editAddressForm.reset({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? '',
      postalCode: address.postalCode,
      city: address.city,
      country: address.country,
      isDefault: address.isDefault,
    });
  }

  cancelEdit(): void {
    this.editingAddressId.set(null);
    this.editAddressForm.reset(this.getEmptyAddress());
  }

  saveAddress(addressId: number): void {
    if (this.editAddressForm.invalid) {
      this.editAddressForm.markAllAsTouched();
      this.toast.show('Formulaire adresse invalide.');
      return;
    }

    this.addressesService.updateAddress(addressId, this.toPayload(this.editAddressForm.getRawValue())).subscribe({
      next: () => {
        this.toast.show('Adresse mise a jour.');
        this.cancelEdit();
        this.loadAddresses();
      },
      error: () => {
        this.toast.show('Impossible de mettre a jour l adresse.');
      },
    });
  }

  createAddress(): void {
    if (this.createAddressForm.invalid) {
      this.createAddressForm.markAllAsTouched();
      this.toast.show('Formulaire adresse invalide.');
      return;
    }

    this.addressesService.createAddress(this.toPayload(this.createAddressForm.getRawValue())).subscribe({
      next: () => {
        this.toast.show('Adresse ajoutee.');
        this.createAddressForm.reset(this.getEmptyAddress());
        this.loadAddresses();
      },
      error: () => this.toast.show('Impossible d ajouter l adresse.'),
    });
  }

  deleteAddress(addressId: number): void {
    this.addressesService.deleteAddress(addressId).subscribe({
      next: () => {
        this.toast.show('Adresse supprimee.');
        this.loadAddresses();
      },
      error: () => this.toast.show('Impossible de supprimer l adresse.'),
    });
  }

  setDefault(address: Address): void {
    this.addressesService.updateAddress(address.id, { isDefault: true }).subscribe({
      next: () => {
        this.toast.show('Adresse par defaut mise a jour.');
        this.loadAddresses();
      },
      error: () => this.toast.show('Impossible de definir l adresse par defaut.'),
    });
  }

  private loadAddresses(): void {
    this.addressesService.getMyAddresses().subscribe({
      next: (data) => this.addresses.set(data),
      error: () => this.toast.show('Impossible de charger les adresses.'),
    });
  }

  private toPayload(value: AddressFormValue) {
    return {
      label: value.label,
      fullName: value.fullName,
      phone: value.phone,
      line1: value.line1,
      line2: value.line2.trim() ? value.line2 : null,
      postalCode: value.postalCode,
      city: value.city,
      country: value.country,
      isDefault: value.isDefault,
    };
  }

  private getEmptyAddress(): AddressFormValue {
    return {
      label: '',
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      postalCode: '',
      city: '',
      country: '',
      isDefault: false,
    };
  }
}
