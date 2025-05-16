export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  image: string;
  eyeColor: string;
  university: string;
  macAddress: string;
  ip: string;
  address: {
    postalCode: string;
    city: string;
  };
}

export interface GenderResponse {
  name: string;
  gender: string;
  probability: number;
  count: number;
}

export interface ZipResponse {
  'post code': string;
  country: string;
  'country abbreviation': string;
  places: {
    'place name': string;
    state: string;
    'state abbreviation': string;
  }[];
}
