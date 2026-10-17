import { describe, expect, it } from 'vitest';
import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
import { appointmentCalendar } from './appointment-calendar';

const appointment: CustomerAccount['history'][number] = {
	id: 'appointment-1',
	type: 'appointments',
	name: 'Salon haircut',
	status: 'confirmed',
	createdAt: '2026-10-01T08:00:00Z',
	version: 1,
	amountMinor: 5000,
	start: '2027-01-10T08:00:00+02:00',
	end: '2027-01-10T08:30:00+02:00',
	payment: 'paid',
	hasReceipt: true,
	booking: {
		serviceId: 'cut',
		resourceId: 'stylist',
		calendarStatus: 'confirmed',
		calendarError: '',
		refundStatus: '',
		cancel: true,
		reschedule: true,
		noticeHours: 24
	}
};
const now = new Date('2026-10-17T00:00:00Z');
const unfold = (value: string) => value.replace(/\r\n /g, '');

describe('appointment calendar handoff', () => {
	it('transfers exact instants with a clean account URL and stable tenant-scoped identity', () => {
		const file = appointmentCalendar(
			appointment,
			'https://user:secret@salon.example.test/anything?token=private#secret',
			now
		)!;
		const lines = unfold(file).split('\r\n');
		expect(lines[0]).toBe('BEGIN:VCALENDAR');
		expect(lines.slice(-2)).toEqual(['END:VCALENDAR', '']);
		expect(lines).toContain('DTSTART:20270110T060000Z');
		expect(lines).toContain('DTEND:20270110T063000Z');
		expect(lines).toContain('DTSTAMP:20261017T000000Z');
		expect(lines).toContain('CLASS:PRIVATE');
		expect(lines).toContain('URL:https://salon.example.test/account');
		expect(file).not.toMatch(/secret|token|private#|user|payment|ATTENDEE|ORGANIZER|METHOD:/);
		const uid = lines.find((line) => line.startsWith('UID:'));
		const updated = unfold(
			appointmentCalendar(
				{
					...appointment,
					start: '2027-01-11T08:00:00+02:00',
					end: '2027-01-11T08:30:00+02:00',
					version: 2
				},
				'https://salon.example.test',
				now
			)!
		);
		expect(updated.split('\r\n')).toContain(uid);
		expect(updated).toContain('DTSTART:20270111T060000Z');
		expect(
			unfold(appointmentCalendar(appointment, 'https://other.example.test', now)!)
		).not.toContain(uid);
	});

	it('withholds tentative, uncertain, cancelled, other-type and invalid-time snapshots', () => {
		const cases: Partial<typeof appointment>[] = [
			{ status: 'requested' },
			{ status: 'cancelled' },
			{ status: 'rescheduling' },
			{ type: 'rentals' },
			{ type: 'enrolments' },
			{ booking: undefined },
			{ id: '' },
			{ start: '' },
			{ start: '2027-01-10T08:00:00' },
			{ start: '2027-02-30T08:00:00Z' },
			{ start: '2027-01-10T08:00:00.123+02:00' },
			{ end: 'not a date' },
			{ end: appointment.start },
			{ end: '2027-01-09T08:00:00Z' },
			...['pending', 'review', 'failed', 'cancelled', 'unknown'].map((calendarStatus) => ({
				booking: { ...appointment.booking!, calendarStatus }
			}))
		];
		for (const change of cases) {
			expect(
				appointmentCalendar({ ...appointment, ...change }, 'https://salon.example.test', now),
				JSON.stringify(change)
			).toBeNull();
		}
		for (const calendarStatus of ['', 'not_required', 'confirmed']) {
			expect(
				appointmentCalendar(
					{ ...appointment, booking: { ...appointment.booking!, calendarStatus } },
					'https://salon.example.test',
					now
				)
			).not.toBeNull();
		}
	});

	it('escapes untrusted text, folds UTF-8 without splitting characters and uses CRLF', () => {
		const name = 'Café 😀'.repeat(30) + '\\; ,\r\nBEGIN:VEVENT\rATTENDEE:injected\nEnd\u0000';
		const file = appointmentCalendar(
			{ ...appointment, name, id: 'id\r\nEND:VEVENT' },
			'https://salon.example.test',
			now
		)!;
		for (const line of file.split('\r\n'))
			expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		expect(file.replaceAll('\r\n', '')).not.toMatch(/[\r\n\ufffd]/);
		expect(file).not.toContain('\u0000');
		const unfolded = unfold(file);
		expect(unfolded.split('\r\n').filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(1);
		expect(unfolded).toContain(
			'SUMMARY:' + 'Café 😀'.repeat(30) + '\\\\\\; \\,\\nBEGIN:VEVENT\\nATTENDEE:injected\\nEnd\r\n'
		);
		expect(unfolded).toContain('id%0D%0AEND%3AVEVENT@mywinkel');
	});
});
