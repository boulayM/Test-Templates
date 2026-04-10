import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Address, AddressUpdateInput } from '../../shared/models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  constructor(private api: ApiService) {}

  getMyAddresses(): Observable<Address[]> {
    return this.api.get<{ data: Address[] }>('/public/addresses').pipe(
      map((res) => res.data || []),
    );
  }

  createAddress(input: Omit<Address, 'id'>): Observable<Address> {
    return this.api
      .post<{ address: Address }>('/public/addresses', input)
      .pipe(map((res) => res.address));
  }

  updateAddress(addressId: number, input: AddressUpdateInput): Observable<Address> {
    return this.api
      .patch<{ address: Address }>(`/public/addresses/${addressId}`, input)
      .pipe(map((res) => res.address));
  }

  deleteAddress(addressId: number): Observable<{ message: string }> {
    return this.api.deleteRequest<{ message: string }>(`/public/addresses/${addressId}`);
  }
}
