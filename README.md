# CHHD / Gerhard Dinhof

February 17, 2023

## General Notes

- Please rename `.env.template` into `.env`  - sample accounts from `01_setup` are pre-populated and pushed to the repository on purpose.
- Outputs, when available: `**/*.log`
- Tested with Node v18

## Remarks

- Task 03 / SCS: Deployment & Deletion succeeds, but query fails
- Task 04 / Scheduler: failed to set the expiration time

## Run

- `cd` into subdirs and run
  - 01: `node setup.js`
  - 02: `node hts.js`
  - 03: `node scs.js`
  - 04: `node scheduledtx.js`
  - 05: `node multisig.js`
  - 06: `node consensus.js` 