export interface Message {
  id?: number;
  text: string;
  me: boolean;
  input?: boolean;
  typeInput?: 'name' | 'zodiac' | 'description' | 'email';
  typing?: boolean;
}
