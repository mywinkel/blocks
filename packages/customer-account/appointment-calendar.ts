import { z } from 'zod';
import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';

type HistoryRow = CustomerAccount['history'][number];
const instant = z.iso.datetime({ offset: true });

export function canDownloadAppointment(row: HistoryRow): boolean {
	return (
		row.type === 'appointments' &&
		row.status === 'confirmed' &&
		!!row.booking &&
		['', 'confirmed', 'not_required'].includes(row.booking.calendarStatus) &&
		!!row.id &&
		instant.safeParse(row.start).success &&
		instant.safeParse(row.end).success &&
		// iCalendar DATE-TIME has whole-second precision; never silently round a booking.
		Date.parse(row.start) % 1000 === 0 &&
		Date.parse(row.end) % 1000 === 0 &&
		Date.parse(row.end) > Date.parse(row.start)
	);
}

function text(value: string): string {
	return value
		.replaceAll('\\', '\\\\')
		.replace(/\r\n|\r|\n/g, '\\n')
		.replaceAll(';', '\\;')
		.replaceAll(',', '\\,')
		.replace(/\p{Cc}/gu, '');
}

// Fold by UTF-8 octets without splitting a code point. Continuation space counts.
function fold(line: string): string {
	const encoder = new TextEncoder();
	let bytes = 0;
	let output = '';
	for (const character of line) {
		const size = encoder.encode(character).length;
		if (bytes + size > 75) {
			output += '\r\n ';
			bytes = 1;
		}
		output += character;
		bytes += size;
	}
	return output;
}

function date(value: string | Date): string {
	return new Date(value)
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}Z$/, 'Z');
}

/** A private local snapshot, never a subscription, invitation or booking command. */
export function appointmentCalendar(
	row: HistoryRow,
	origin: string,
	now = new Date()
): string | null {
	if (!canDownloadAppointment(row)) return null;
	const site = new URL(origin);
	if (!['http:', 'https:'].includes(site.protocol)) return null;
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//My Winkel//Appointment snapshot//EN',
		'BEGIN:VEVENT',
		// Origin includes the tenant host (and local fixture port), never account identity.
		`UID:${encodeURIComponent(site.origin)}/${encodeURIComponent(row.id)}@mywinkel`,
		`DTSTAMP:${date(now)}`,
		`DTSTART:${date(row.start)}`,
		`DTEND:${date(row.end)}`,
		`SUMMARY:${text(row.name)}`,
		'DESCRIPTION:Booking snapshot. Check your customer account for changes. This file does not update automatically.',
		`URL:${site.origin}/account`,
		'CLASS:PRIVATE',
		'STATUS:CONFIRMED',
		'END:VEVENT',
		'END:VCALENDAR'
	];
	return lines.map(fold).join('\r\n') + '\r\n';
}
