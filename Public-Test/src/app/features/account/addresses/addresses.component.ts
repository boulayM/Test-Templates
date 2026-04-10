import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AddressService } from '../../../core/services/address.service';
import { Address } from '../../../shared/models/address.model';

@Component({
  selector: 'app-addresses',
  imports: [CommonModule, RouterModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
})
export class AddressesComponent implements OnInit {
  private addressService = inject(AddressService);

  addresses: Address[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les adresses.';
        this.loading = false;
      },
    });
  }
}
