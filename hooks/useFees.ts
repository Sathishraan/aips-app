import { useQuery } from '@tanstack/react-query';
import { getData, getAuthenticatedUrl } from '../api/generic.api';
import { getSelectedStudentId } from '../api/selectedStudent';
import { FeesDetailsResponse, FeeHistoryRecord, FeeSubCategory } from '../types/fees.type';

/**
 * Normalize fees/details payload for FeesScreen.
 * Backend returns: stud_id, fees_name, subcategorys_list, parent_category, prepaid_fees_details
 */
const normalizeFeesDetails = (raw: any): FeesDetailsResponse => {
    const data = raw?.data && (raw.data.subcategorys_list || raw.data.fees_name)
        ? raw.data
        : (raw || {});

    const feesName: Record<string, any> = data.fees_name || {};
    const subcats: Record<string, FeeSubCategory> = data.subcategorys_list || {};
    const prepaid: Record<string, string> = data.prepaid_fees_details || {};

    // Merge amounts from fees_name into subcategory list (API select omits fee_amount)
    const subcategorys_list: Record<string, FeeSubCategory> = {};
    Object.entries(subcats).forEach(([id, item]) => {
        const amountFromAssign = feesName[id] ?? feesName[item.fee_name_id];
        subcategorys_list[id] = {
            fee_name_id: String(item.fee_name_id ?? id),
            fee_name: item.fee_name || String(id),
            fee_amount: String(
                item.fee_amount ??
                (amountFromAssign !== undefined && amountFromAssign !== null
                    ? amountFromAssign
                    : '0')
            ),
        };
    });

    // If subcategory list empty but fees_name has entries, build from that
    if (Object.keys(subcategorys_list).length === 0 && feesName && typeof feesName === 'object') {
        Object.entries(feesName).forEach(([id, amount]) => {
            if (['edit_new_clasfee_id', 'edit_old_clasfee_id', 'student_id'].includes(id)) {
                return;
            }
            subcategorys_list[id] = {
                fee_name_id: String(id),
                fee_name: `Fee ${id}`,
                fee_amount: String(amount ?? '0'),
            };
        });
    }

    const prepaid_fees_details: Record<string, string> = {};
    Object.entries(prepaid).forEach(([key, value]) => {
        prepaid_fees_details[String(key)] = String(value ?? '0');
    });

    return {
        stud_id: String(data.stud_id ?? ''),
        fees_name: Array.isArray(data.fees_name)
            ? data.fees_name
            : Object.entries(feesName).map(([k, v]) => ({ id: k, amount: v })),
        subcategorys_list,
        parent_category: data.parent_category || {},
        prepaid_fees_details,
    };
};

export const useFeesDetails = () => {
    const selectedId = getSelectedStudentId();
    return useQuery<FeesDetailsResponse>({
        queryKey: ['fees', 'details', selectedId],
        queryFn: async () => {
            // Correct route (api/student/fees is 404)
            const response = await getData<any>('api/fees/details');

            console.log('--- Fees Details Raw ---');
            console.log(JSON.stringify(response, null, 2)?.slice(0, 2000));

            const normalized = normalizeFeesDetails(response);

            console.log('--- Fees Details Normalized ---', {
                stud_id: normalized.stud_id,
                subCount: Object.keys(normalized.subcategorys_list || {}).length,
                paidCount: Object.keys(normalized.prepaid_fees_details || {}).length,
            });

            return normalized;
        },
    });
};

export const useFeesHistory = () => {
    const selectedId = getSelectedStudentId();
    return useQuery<FeeHistoryRecord[]>({
        queryKey: ['fees', 'history', selectedId],
        queryFn: async () => {
            const response = await getData<any>('api/fees/payment/history');

            console.log('--- Fees History Raw ---');
            console.log(JSON.stringify(response, null, 2)?.slice(0, 2000));

            let data: FeeHistoryRecord[] = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response?.data && Array.isArray(response.data)) {
                data = response.data;
            } else if (response?.payment_history && Array.isArray(response.payment_history)) {
                data = response.payment_history.map((item: any, idx: number) => ({
                    invoiceId: item.receipt_no || item.invoiceId || `REC-${idx + 1}`,
                    class: item.class || '',
                    totalAmount: String(item.amount || item.totalAmount || '0'),
                    invoiceSlip: item.invoiceSlip || '',
                    paymentDate: item.date || item.paymentDate || '',
                    fees_details: item.fees_details || { Payment: String(item.amount || '0') },
                }));
            }

            return data.map((item) => ({
                ...item,
                invoiceId: String(item.invoiceId ?? ''),
                totalAmount: String(item.totalAmount ?? '0'),
                paymentDate: item.paymentDate || '',
                fees_details: item.fees_details || {},
                invoiceFullUrl: item.invoiceSlip
                    ? getAuthenticatedUrl(item.invoiceSlip)
                    : undefined,
            }));
        },
    });
};
