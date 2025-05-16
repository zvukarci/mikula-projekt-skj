import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInUser = new BehaviorSubject<User | null>(null);
  private loginTime = new BehaviorSubject<Date | null>(null);
  private clickCount = new BehaviorSubject<number>(0);
  private totalCharacters = new BehaviorSubject<number>(0);
  private chatStartCount = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.loggedInUser.next(JSON.parse(storedUser));
      this.loginTime.next(new Date(localStorage.getItem('loginTime') || ''));
    }
  }

  login(firstName: string, lastName: string): Observable<boolean> {
    return this.http.get<{ users: User[] }>('https://dummyjson.com/users').pipe(
      map((response) => {
        const matchingUser = response.users.find(
          (u) =>
            u.firstName.toLowerCase() === firstName.toLowerCase() &&
            u.lastName.toLowerCase() === lastName.toLowerCase()
        );

        if (matchingUser) {
          localStorage.setItem('currentUser', JSON.stringify(matchingUser));
          const now = new Date();
          localStorage.setItem('loginTime', now.toISOString());
          this.loggedInUser.next(matchingUser);
          this.loginTime.next(now);
          this.resetStats();
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    this.loggedInUser.next(null);
    this.loginTime.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
  }

  getLoggedInUser(): Observable<User | null> {
    return this.loggedInUser.asObservable();
  }

  getLoginTime(): Observable<Date | null> {
    return this.loginTime.asObservable();
  }

  incrementClickCount(): void {
    this.clickCount.next(this.clickCount.value + 1);
  }

  getClickCount(): Observable<number> {
    return this.clickCount.asObservable();
  }

  addCharacters(count: number): void {
    this.totalCharacters.next(this.totalCharacters.value + count);
  }

  getTotalCharacters(): Observable<number> {
    return this.totalCharacters.asObservable();
  }

  incrementChatCount(): void {
    this.chatStartCount.next(this.chatStartCount.value + 1);
  }

  getChatCount(): Observable<number> {
    return this.chatStartCount.asObservable();
  }

  private resetStats(): void {
    this.clickCount.next(0);
    this.totalCharacters.next(0);
    this.chatStartCount.next(0);
  }

  getSessionDuration(): { hours: number; minutes: number; seconds: number } {
    const start = this.loginTime.value;
    const end = new Date();
    const diff = end.getTime() - (start?.getTime() || end.getTime());

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.ceil((diff % 60000) / 1000);

    return { hours, minutes, seconds };
  }

  isLoggedIn(): boolean {
    return !!this.loggedInUser.value;
  }
}
