export interface FeeSubCategory {
  fee_name_id: string;
  fee_name: string;
  fee_amount?: string;
}

export interface FeeParentCategory {
  fee_cat: string;
  fee_category_name: string;
}

export interface FeesDetailsResponse {
  stud_id: string;
  fees_name: any[];
  subcategorys_list: Record<string, FeeSubCategory>;
  parent_category: Record<string, FeeParentCategory>;
  prepaid_fees_details: Record<string, string>;
}

export interface FeeHistoryRecord {
  invoiceId: string;
  class: string;
  totalAmount: string;
  invoiceSlip: string;
  invoiceFullUrl?: string;
  paymentDate: string;
  fees_details: Record<string, string>;
}

export type FeesHistoryResponse = FeeHistoryRecord[];