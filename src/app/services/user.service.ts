import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User, GenderResponse, ZipResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: User[] = [];

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    if (this.users.length > 0) {
      return of(
        this.users.filter((user) => user.id !== this.getCurrentUserId())
      );
    }

    return this.http.get<{ users: User[] }>('https://dummyjson.com/users').pipe(
      map((response) => {
        this.users = response.users;
        return this.users.filter((user) => user.id !== this.getCurrentUserId());
      })
    );
  }

  getUserDetails(id: number): Observable<any> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      return this.http
        .get<User>(`https://dummyjson.com/users/${id}`)
        .pipe(switchMap((user) => this.enrichUserData(user)));
    }

    return this.enrichUserData(user);
  }

  private enrichUserData(user: User): Observable<any> {
    // Get gender data from genderize.io
    const genderRequest = this.http
      .get<GenderResponse>(`https://api.genderize.io?name=${user.firstName}`)
      .pipe(
        catchError(() => of({ gender: 'unknown', probability: 0, count: 0 }))
      );

    // Get location data from zippopotam.us if postal code exists
    const zipRequest = user.address?.postalCode
      ? this.http
          .get<ZipResponse>(
            `https://api.zippopotam.us/us/${user.address.postalCode}`
          )
          .pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin({
      user: of(user),
      genderData: genderRequest,
      zipData: zipRequest,
    }).pipe(
      map(({ user, genderData, zipData }) => ({
        ...user,
        testGender: genderData?.gender || 'unknown',
        homeState: zipData?.places?.[0]?.state || 'unknown',
        // Include all required fields
        username: user.username,
        birthDate: user.birthDate,
        image: user.image,
        eyeColor: user.eyeColor,
        university: user.university,
        macAddress: user.macAddress,
        ip: user.ip,
        city: user.address?.city || 'unknown',
      }))
    );
  }

  private getCurrentUserId(): number {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser).id : -1;
  }
}
