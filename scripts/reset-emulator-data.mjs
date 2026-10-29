// Delete the persisted emulator data so the next `npm run emulators` starts empty.
import { rmSync } from 'node:fs';

rmSync('.firebase-data', { recursive: true, force: true });
console.log('Cleared ./.firebase-data — the emulators will start with no data.');
