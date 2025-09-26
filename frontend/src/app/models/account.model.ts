export interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  currency: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface AccountSummary {
  accountNumber: string;
  balance: number;
  currency: string;
  displayBalance: string;
  isActive: boolean;
}
