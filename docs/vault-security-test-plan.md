# Vault Security Test Plan

Purpose: Validate PIN hashing, rate limiting, remote sync, change/remove flows, and resilience against simple attacks.

## Preconditions
- Logged-in user with valid Firebase Auth session.
- Firestore Rules deployed matching `backend.json` (user doc writable by owner).
- Local environment started: `npm run dev`.
- Open DevTools (Application > Local Storage) and Firestore viewer (optional).

## Test Data
- Test PIN A: 1357
- Test PIN B: 8642
- Malicious Sequence: 0000,1111,2222,3333,4444,5555

## Step Matrix
| # | Scenario | Action | Expected Result |
|---|----------|--------|----------------|
| 1 | Initial access without PIN | Visit `/vault` fresh user | Prompt to create PIN |
| 2 | Create PIN (A) | Enter 1-3-5-7 then confirm | LocalStorage contains JSON `{hash,salt,version}` (no plaintext) |
| 3 | Hash integrity | Inspect stored value | `hash` & `salt` are Base64 strings; length hash≈44 chars (32 bytes); no digits of PIN visible |
| 4 | Remote sync | Check Firestore `/users/{uid}` doc | Field `vaultPin.hash/salt/version` present |
| 5 | Successful auth | Reload `/vault`, enter PIN A | Access granted, entries load |
| 6 | Failed attempt | Enter 9999 | Error message; inputs cleared; attempts increment |
| 7 | Rate limiting threshold | Rapidly enter Malicious Sequence until lock | After 5th failed attempt: lockout message & countdown (~30s) |
| 8 | Lockout behavior | During countdown enter digits | Inputs disabled; PIN not processed |
| 9 | Post-lockout reset | Wait countdown reaches 0; enter correct PIN | Auth succeeds; attempts reset (no lockout) |
|10 | Settings navigation | Click Security Settings | `/vault/settings` loads |
|11 | Verify current PIN | Enter PIN A in verify step | Advances to new PIN step |
|12 | Mismatch new PIN | Enter PIN B then confirm different digits | Error 'PINs do not match'; fields reset |
|13 | Successful change | Enter PIN B + confirm | Success alert; local + Firestore updated |
|14 | Old PIN invalid | Return to `/vault`, enter PIN A | Error; no access |
|15 | New PIN valid | Enter PIN B | Access granted |
|16 | Remove PIN | Use Remove PIN in settings | LocalStorage key removed; Firestore `vaultPin` becomes null |
|17 | Access after removal | Visit `/vault` again | Prompt to create new PIN |
|18 | Recreate PIN | Create PIN A again | Fresh hash & salt differ from previous (new salt) |
|19 | DevTools tamper | Edit LocalStorage `hash` to random | Next correct PIN entry fails (hash mismatch) |
|20 | Replay attack check | Copy old hash/salt from earlier session, replace current | PIN from earlier session works only if hash & salt match; version allows future upgrades |

## Detailed Procedures
### 1. PIN Creation & Hash Validation
1. Navigate to `/vault`.
2. Enter PIN A (1357) then confirm.
3. Open DevTools > Application > Local Storage; find key `user_pin_<uid>`.
4. Confirm object shape: `{"hash":"<Base64>","salt":"<Base64>","version":1}`.
5. Decode Base64 (optional) to check lengths: `hash` 32 bytes, `salt` 16 bytes.

### 2. Authentication & Rate Limiting
1. Reload page, enter wrong PINs in Malicious Sequence quickly.
2. On 5th failure observe lockout.
3. Attempt further inputs—should be disabled.
4. After countdown completes, enter correct PIN; succeeds.

### 3. PIN Change Flow
1. Go to `/vault/settings`.
2. Verify current PIN A.
3. Enter new PIN B + confirm; observe success banner.
4. Confirm Local Storage & Firestore updated.
5. Attempt old PIN—fails; new PIN—succeeds.

### 4. Removal Flow
1. In settings click Remove PIN.
2. Ensure local key removed; Firestore `vaultPin` null.
3. `/vault` prompts for new PIN again.

### 5. Tamper & Resilience
1. Modify local `hash` to random string; enter correct PIN—fails.
2. Restore original hash/salt; PIN works again.
3. Replace `version` with `2` (simulated future upgrade); current logic still authenticates (forward-compatible field ignored now).

## Acceptance Criteria
- No plaintext PIN stored client or server.
- Lockout engages exactly after 5 failed attempts within 60s window.
- Countdown releases automatically without manual refresh.
- Changing/removing PIN updates both local & remote copies.
- Tampering causes authentication failure until data restored.

## Regression Checklist (Quick)
- Dashboard unaffected by vault changes.
- Lint/Typecheck remain clean: `npm run lint && npm run typecheck`.
- Other secured flows (journal entry creation) unaffected.

## Optional Automated Test Ideas
- Jest + jsdom unit test for `hashPin/verifyPin` deterministic length & mismatch behavior.
- Cypress e2e script simulating rapid wrong attempts and timing lockout.
- Integration test that mocks Firestore to assert `vaultPin` merge data shape.

## Commands
```bash
npm run dev
npm run lint
npm run typecheck
```

## Future Hardening Suggestions
- Add server-side Cloud Function rate limit (store attempt counter remotely).
- WebAuthn / Passkey optional secondary factor.
- Encrypt journal entry content with user-derived key (PIN-based key stretching) instead of only gating UI.
- Background scheduled rehash if iteration count increases (migration path using `version`).
