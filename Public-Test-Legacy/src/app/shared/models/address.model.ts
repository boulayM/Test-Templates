export interface Address {
  id: number;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export type AddressUpdateInput = Partial<
  Omit<Address, 'id'>
>;
