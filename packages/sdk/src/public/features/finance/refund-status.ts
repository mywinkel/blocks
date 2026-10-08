export function refundStatusMessage(status: unknown) {
	switch (status) {
		case 'approval':
			return 'Refund awaiting review by the business. No refund has been submitted.';
		case 'pending':
			return 'Refund pending. Amounts update when each payment provider confirms the refund.';
		case 'review':
			return 'Refund needs review. The provider may have received the request. Contact support to confirm its outcome before requesting another refund.';
		case 'failed':
			return 'Refund was not submitted or was rejected. Review the payment connection and details before trying again.';
		case 'partial':
			return 'Part of this refund was confirmed. Review the linked receipts for amounts that were not refunded.';
		case 'confirmed':
			return 'Refund confirmed. The linked receipts and credit notes show the amounts refunded.';
		default:
			return '';
	}
}
