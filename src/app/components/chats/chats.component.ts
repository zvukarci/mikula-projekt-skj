import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@/app/services/auth.service';
import { UserService } from '@/app/services/user.service';
import { ChatService } from '@/app/services/chat.service';
import { User } from '@/app/models/user.model';
import { Chat, ChatMessage } from '@/app/models/chat.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.css',
})
export class ChatsComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  userDetails: any | null = null;
  currentChat$: Observable<Chat | null>;
  allMessages$: Observable<ChatMessage[]>;
  newMessage: string = '';
  loginTime: Date | null = null;
  clickCount: number = 0;
  totalCharacters: number = 0;
  chatCount: number = 0;
  showHistory: boolean = true;
  searchQuery: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private chatService: ChatService,
    private router: Router
  ) {
    this.currentChat$ = this.chatService.getCurrentChat();
    this.allMessages$ = this.chatService.getAllMessages();
  }

  ngOnInit(): void {
    this.authService.getLoggedInUser().subscribe((user) => {
      this.currentUser = user;
    });

    this.authService.getLoginTime().subscribe((time) => {
      this.loginTime = time;
    });

    this.authService.getClickCount().subscribe((count) => {
      this.clickCount = count;
    });

    this.authService.getTotalCharacters().subscribe((count) => {
      this.totalCharacters = count;
    });

    this.authService.getChatCount().subscribe((count) => {
      this.chatCount = count;
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
      this.filterUsers(); // Initialize filtered users
    });
  }

  filterUsers(): void {
    if (!this.searchQuery) {
      this.filteredUsers = this.users;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.authService.incrementClickCount();
  }

  showUserDetails(user: User): void {
    this.userDetails = null;
    this.showHistory = false;
    this.userService.getUserDetails(user.id).subscribe((details) => {
      this.userDetails = details;
    });
  }

  closeUserDetails(): void {
    this.userDetails = null;
    this.showHistory = true;
  }

  startChat(user: User): void {
    this.chatService.startChat(user);
    this.closeUserDetails();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage).subscribe(() => {
        this.newMessage = '';
        this.adjustTextareaHeight();
      });
    }
  }

  endCurrentChat(): void {
    this.chatService.endChat();
  }

  logout(): void {
    const duration = this.authService.getSessionDuration();
    const totalReplyChars = this.chatService.getTotalReplyCharacters();

    alert(
      `Session Summary:\nDuration: ${duration.hours}:${duration.minutes}:${duration.seconds}\nTotal Reply Characters: ${totalReplyChars}`
    );

    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onKeyPress(event: KeyboardEvent): void {
    this.adjustTextareaHeight(event.target as HTMLTextAreaElement);

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private adjustTextareaHeight(element?: HTMLTextAreaElement): void {
    if (!element) {
      const textarea = document.querySelector('.chat-input textarea');
      if (textarea) {
        element = textarea as HTMLTextAreaElement;
      } else {
        return;
      }
    }

    element.style.height = '44px'; // Reset height to default
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`; // Cap at 120px
  }
}
