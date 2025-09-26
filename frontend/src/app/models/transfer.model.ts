import {Account} from './account.model';

export interface Transfer {
  id: number;
  fromAccount: Account;
  toAccount: Account;
  amount: number;
  description?: string;
  status: TransferStatus;
  createdAt: string;
}

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface TransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export interface TransferSummary {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: 'incoming' | 'outgoing';
  accountNumber: string;
  status: TransferStatus;
  displayAmount: string;
  displayDate: string;
}
