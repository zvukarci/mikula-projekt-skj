import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chat, ChatMessage, HttpBinResponse } from '../models/chat.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private currentChat = new BehaviorSubject<Chat | null>(null);
  private allMessages = new BehaviorSubject<ChatMessage[]>([]);
  private replyCharacters = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient, private authService: AuthService) {}

  startChat(participant: User): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    // End previous chat if exists
    if (this.currentChat.value) {
      this.endChat();
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      participant,
      messages: [],
    };

    this.currentChat.next(newChat);
    this.authService.incrementChatCount();
  }

  endChat(): void {
    this.currentChat.next(null);
  }

  getCurrentChat(): Observable<Chat | null> {
    return this.currentChat.asObservable();
  }

  getAllMessages(): Observable<ChatMessage[]> {
    return this.allMessages.asObservable();
  }

  sendMessage(text: string): Observable<ChatMessage> {
    const currentUser = this.getCurrentUser();
    const chat = this.currentChat.value;

    if (!currentUser || !chat) {
      throw new Error('No active chat or user not logged in');
    }

    const message: ChatMessage = {
      text,
      sender: currentUser,
      receiver: chat.participant,
      timestamp: new Date(),
      isReply: false,
    };

    // Add to chat history
    chat.messages.push(message);

    // Add to all messages
    const allMsgs = this.allMessages.value;
    allMsgs.push(message);
    this.allMessages.next(allMsgs);

    // Track character count
    this.authService.addCharacters(text.length);

    // Send to server
    return this.http
      .post<HttpBinResponse>('https://httpbin.org/post', { text })
      .pipe(
        map((response) => {
          // Create reply based on the response
          const replyLength =
            response.json.text.length +
            Number(response.origin.split('.').pop() || '0');

          const replyText = 'A'.repeat(replyLength);

          const reply: ChatMessage = {
            text: replyText,
            sender: chat.participant,
            receiver: currentUser,
            timestamp: new Date(),
            isReply: true,
          };

          // Add reply to chat
          chat.messages.push(reply);

          // Add to all messages
          allMsgs.push(reply);
          this.allMessages.next(allMsgs);

          // Track reply characters
          this.replyCharacters.next(
            this.replyCharacters.value + replyText.length
          );

          return reply;
        })
      );
  }

  getTotalReplyCharacters(): number {
    return this.replyCharacters.value;
  }

  private getCurrentUser(): User | null {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  }
}
