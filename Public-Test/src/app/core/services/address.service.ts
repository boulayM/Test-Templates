import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Address } from '../../shared/models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private api = inject(ApiService);

  getAddresses(): Observable<Address[]> {
    return this.api
      .get<{ data: Address[] }>('/public/addresses')
      .pipe(map((res) => res.data || []));
  }
}
