import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Address } from '../../../shared/models/address.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  addresses = signal<Address[]>([]);
  editingAddressId = signal<number | null>(null);
  draftAddress: Partial<Address> = {};
  newAddress: Partial<Address> = this.getEmptyAddress();

  constructor(
    private auth: AuthService,
    private addressesService: AddressService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((u) => {
      this.user.set(u);
    });
    this.loadAddresses();
  }

  startEdit(address: Address): void {
    this.editingAddressId.set(address.id);
    this.draftAddress = { ...address };
  }

  cancelEdit(): void {
    this.editingAddressId.set(null);
    this.draftAddress = {};
  }

  saveAddress(addressId: number): void {
    const payload = {
      label: this.draftAddress.label || '',
      fullName: this.draftAddress.fullName || '',
      phone: this.draftAddress.phone || '',
      line1: this.draftAddress.line1 || '',
      line2: this.draftAddress.line2 || null,
      postalCode: this.draftAddress.postalCode || '',
      city: this.draftAddress.city || '',
      country: this.draftAddress.country || '',
      isDefault: Boolean(this.draftAddress.isDefault),
    };

    this.addressesService.updateAddress(addressId, payload).subscribe({
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
    const payload = {
      label: this.newAddress.label || '',
      fullName: this.newAddress.fullName || '',
      phone: this.newAddress.phone || '',
      line1: this.newAddress.line1 || '',
      line2: this.newAddress.line2 || null,
      postalCode: this.newAddress.postalCode || '',
      city: this.newAddress.city || '',
      country: this.newAddress.country || '',
      isDefault: Boolean(this.newAddress.isDefault),
    };
    this.addressesService.createAddress(payload).subscribe({
      next: () => {
        this.toast.show('Adresse ajoutee.');
        this.newAddress = this.getEmptyAddress();
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
    this.addressesService
      .updateAddress(address.id, { isDefault: true })
      .subscribe({
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

  private getEmptyAddress(): Partial<Address> {
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
