// Run with: bun src/lib/time-blocks.test.ts
import assert from 'node:assert/strict';
import { getBlockForHour } from './time-blocks';

const row = (d: Date) => Array.from({ length: 24 }, (_, h) => getBlockForHour(d, h)).join('');

// Mon 2 Nov 2026, high season workday (old layout)
assert.equal(row(new Date(2026, 10, 2)), '333333211111112211112233');
// Mon 4 Jan 2027, high season workday
assert.equal(row(new Date(2027, 0, 4)), '333333111111222221112233');
// Sat 9 Jan 2027, high season weekend
assert.equal(row(new Date(2027, 0, 9)), '444444333333444443333344');
// Mon 1 Mar 2027, low season workday
assert.equal(row(new Date(2027, 2, 1)), '555555333333444443333355');
// Sat 6 Mar 2027, low season weekend
assert.equal(row(new Date(2027, 2, 6)), '555555444444555554444455');
console.log('time-blocks ok');
