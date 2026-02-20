import prisma from "@/db/prisma";
import { TransactionStatus } from "@/lib/generated/prisma";

export const DEFAULT_APPOINTMENT_FEE = 10;
export const DEFAULT_TRANSACTION_CURRENCY = "CNY";

function toPositiveAmount(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Number(numeric);
  }
  return DEFAULT_APPOINTMENT_FEE;
}

export type UpsertCompletedTransactionInput = {
  appointmentId: string;
  doctorId: string;
  paymentGateway: string;
  gatewayTransactionId: string;
  amount: unknown;
  currency?: string;
  transactionDate?: Date;
  notes?: string;
  paymentDetails?: unknown;
};

export async function upsertCompletedTransaction({
  appointmentId,
  doctorId,
  paymentGateway,
  gatewayTransactionId,
  amount,
  currency = DEFAULT_TRANSACTION_CURRENCY,
  transactionDate = new Date(),
  notes,
  paymentDetails,
}: UpsertCompletedTransactionInput) {
  const normalizedAmount = toPositiveAmount(amount);

  return prisma.transaction.upsert({
    where: { gatewayTransactionId },
    update: {
      appointmentId,
      doctorId,
      paymentGateway,
      amount: normalizedAmount,
      currency,
      status: TransactionStatus.COMPLETED,
      transactionDate,
      notes: notes ?? null,
      paymentDetails: paymentDetails ?? undefined,
    },
    create: {
      appointmentId,
      doctorId,
      paymentGateway,
      gatewayTransactionId,
      amount: normalizedAmount,
      currency,
      status: TransactionStatus.COMPLETED,
      transactionDate,
      notes: notes ?? null,
      paymentDetails: paymentDetails ?? undefined,
    },
  });
}

export async function cancelLatestCompletedTransaction(
  appointmentId: string,
  notes?: string,
) {
  const latestCompletedTransaction = await prisma.transaction.findFirst({
    where: {
      appointmentId,
      status: TransactionStatus.COMPLETED,
    },
    orderBy: { transactionDate: "desc" },
  });

  if (!latestCompletedTransaction) {
    return null;
  }

  return prisma.transaction.update({
    where: { id: latestCompletedTransaction.id },
    data: {
      status: TransactionStatus.CANCELLED,
      notes: notes ?? latestCompletedTransaction.notes,
    },
  });
}
