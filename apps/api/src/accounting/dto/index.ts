export class CreateAccountDto {
  code: string;
  name: string;
  type: string;
  branchId: string;
  description?: string;
}

export class CreateInvoiceDto {
  invoiceNo: string;
  customerId?: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  description?: string;
  accountId: string;
  branchId: string;
  createdBy?: string;
  status?: string;
}

export class CreatePaymentDto {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'Cash' | 'Check' | 'Bank' | 'Online';
  referenceNo?: string;
  notes?: string;
}

export class CreateExpenseDto {
  expenseNo: string;
  description: string;
  amount: number;
  category: string;
  claimedBy: string;
  branchId: string;
  status?: string;
}
