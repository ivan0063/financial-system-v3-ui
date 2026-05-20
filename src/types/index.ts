export interface FinancialProviderCatalog {
  id: number
  name: string
}

export interface FinancialProvider {
  code: string
  name: string
  active: boolean
  financialProviderCatalog: FinancialProviderCatalog
}

export interface DebtAccount {
  code: string
  name: string
  payDay: number
  credit: number
  active: boolean
  accountStatementType: string
  financialProvider: FinancialProvider
}

export interface Debt {
  id: number
  description: string
  operationDate: string
  currentInstallment: number
  maxFinancingTerm: number
  originalAmount: number
  monthlyPayment: number
  active: boolean
  hashSum?: string
  debtAccount: DebtAccount
}

export interface FixedExpenseCatalog {
  id: number
  name: string
}

export interface FixedExpense {
  id: number
  name: string
  monthlyCost: number
  paymentDay: number
  active: boolean
  fixedExpenseCatalog: FixedExpenseCatalog
}

export interface Payment {
  id: number
  paymentDate: string
  amount: number
  debtAccount: DebtAccount
}

export interface AlmostCompletedDebtsDto {
  description: string
  remainingInstallments: number
  monthlyPayment: number
}

export interface UserStatusDashboard {
  salary: number
  savings: number
  monthlyDebtPaymentAmount: number
  debtLoanAmount: number
  debtForLifePlanAmount: number
  monthlyFixedExpensesAmount: number
  userDebtAccounts: DebtAccount[]
  almostCompletedDebts: AlmostCompletedDebtsDto[]
  userFixedExpenses: FixedExpense[]
}

export interface DebtAccountStatusDto {
  debtAccount: DebtAccount
  monthPayment: number
  debts: Debt[]
  almostCompletedDebts: AlmostCompletedDebtsDto[]
}

export interface CreateFinancialProviderReq {
  code: string
  name: string
  email: string
  catalogId: number
}

export interface CreateDebtAccountReq {
  code: string
  name: string
  payDay: number
  credit: number
  accountStatementType: string
}

export interface CreateDebtReq {
  description: string
  operationDate: string
  currentInstallment: number
  maxFinancingTerm: number
  originalAmount: number
  monthlyPayment: number
}

export interface FixedExpenseReq {
  name: string
  monthlyCost: number
  paymentDay: number
  email: string
  catalogId: number
}
