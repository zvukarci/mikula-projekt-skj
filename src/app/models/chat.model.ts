import { User } from './user.model';

export interface ChatMessage {
  text: string;
  sender: User;
  receiver: User;
  timestamp: Date;
  isReply: boolean;
}

export interface Chat {
  id: string;
  participant: User;
  messages: ChatMessage[];
}

export interface HttpBinResponse {
  json: {
    text: string;
  };
  origin: string;
}
