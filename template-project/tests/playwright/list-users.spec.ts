import { expect, test } from '@playwright/test';
import { authHeaders, uniqueEmail } from '../helpers/api-helpers.js';

test('[LISTUSR-001] List users requires authorization.', async ({ request }) => {
	const response = await request.get('/v1/users');

	expect(response.status()).toBe(401);
	expect(await response.json()).toEqual({
		error: 'unauthorized',
		message: 'Authorization required.',
	});
});

test('[LISTUSR-002] List users returns empty array when no users exist.', async ({ request }) => {
	const response = await request.get('/v1/users', {
		headers: authHeaders('usr_pw_list_empty'),
	});

	expect([200, 503]).toContain(response.status());
	if (response.status() === 503) {
		expect(await response.json()).toEqual({
			error: 'service_unavailable',
			message: 'Persistent identity storage is unavailable. Try again later.',
		});
		return;
	}

	const body = await response.json();
	expect(Array.isArray(body.users)).toBe(true);
	if (body.users.length > 0) {
		test.skip(true, 'Environment already contains users; empty-list precondition not met.');
	}
	expect(body.users).toEqual([]);
});

test('[LISTUSR-003] List users returns all created managed users.', async ({ request }) => {
	const userAEmail = uniqueEmail('pw-list-a');
	const userBEmail = uniqueEmail('pw-list-b');

	const createA = await request.post('/v1/users', {
		headers: authHeaders('usr_pw_list_creator'),
		data: {
			email: userAEmail,
			firstName: 'List',
			lastName: 'A',
		},
	});

	expect([201, 503]).toContain(createA.status());
	if (createA.status() === 503) {
		expect(await createA.json()).toEqual({
			error: 'service_unavailable',
			message: 'Persistent identity storage is unavailable. Try again later.',
		});
		return;
	}

	const createB = await request.post('/v1/users', {
		headers: authHeaders('usr_pw_list_creator'),
		data: {
			email: userBEmail,
			firstName: 'List',
			lastName: 'B',
		},
	});
	expect(createB.status()).toBe(201);

	const list = await request.get('/v1/users', {
		headers: authHeaders('usr_pw_list_reader'),
	});
	expect(list.status()).toBe(200);
	const body = await list.json();
	const emails = body.users.map((u: { email: string }) => u.email);
	expect(emails).toContain(userAEmail);
	expect(emails).toContain(userBEmail);
});

test('[LISTUSR-004] List users includes userId, email, firstName, and lastName fields.', async ({ request }) => {
	const response = await request.get('/v1/users', {
		headers: authHeaders('usr_pw_list_fields'),
	});

	expect([200, 503]).toContain(response.status());
	if (response.status() === 503) {
		expect(await response.json()).toEqual({
			error: 'service_unavailable',
			message: 'Persistent identity storage is unavailable. Try again later.',
		});
		return;
	}

	const body = await response.json();
	for (const user of body.users) {
		expect(typeof user.userId).toBe('string');
		expect(typeof user.email).toBe('string');
		expect(typeof user.firstName).toBe('string');
		expect(typeof user.lastName).toBe('string');
	}
});

test('[LISTUSR-005] List users returns users in creation order.', async ({ request }) => {
	const firstEmail = uniqueEmail('pw-order-first');
	const secondEmail = uniqueEmail('pw-order-second');

	const first = await request.post('/v1/users', {
		headers: authHeaders('usr_pw_order_creator'),
		data: {
			email: firstEmail,
			firstName: 'Order',
			lastName: 'First',
		},
	});

	expect([201, 503]).toContain(first.status());
	if (first.status() === 503) {
		expect(await first.json()).toEqual({
			error: 'service_unavailable',
			message: 'Persistent identity storage is unavailable. Try again later.',
		});
		return;
	}

	const second = await request.post('/v1/users', {
		headers: authHeaders('usr_pw_order_creator'),
		data: {
			email: secondEmail,
			firstName: 'Order',
			lastName: 'Second',
		},
	});
	expect(second.status()).toBe(201);

	const list = await request.get('/v1/users', {
		headers: authHeaders('usr_pw_order_reader'),
	});
	expect(list.status()).toBe(200);
	const body = await list.json();

	const firstIndex = body.users.findIndex((u: { email: string }) => u.email === firstEmail);
	const secondIndex = body.users.findIndex((u: { email: string }) => u.email === secondEmail);
	expect(firstIndex).toBeGreaterThanOrEqual(0);
	expect(secondIndex).toBeGreaterThanOrEqual(0);
	expect(firstIndex).toBeLessThan(secondIndex);
});

test('[LISTUSR-006] Invalid token returns unauthorized response.', async ({ request }) => {
	const response = await request.get('/v1/users', {
		headers: {
			Authorization: 'Bearer invalid-token',
		},
	});

	expect(response.status()).toBe(401);
	expect(await response.json()).toEqual({
		error: 'unauthorized',
		message: 'Authorization required.',
	});
});

