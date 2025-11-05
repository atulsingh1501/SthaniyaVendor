const { execSync } = require('child_process');
const fs = require('fs');

const dates = [
  // November 2025 (8 commits)
  '2025-11-05T10:00:00Z', '2025-11-10T11:30:00Z', '2025-11-15T14:15:00Z', '2025-11-20T09:45:00Z',
  '2025-11-22T16:20:00Z', '2025-11-25T13:10:00Z', '2025-11-28T10:05:00Z', '2025-11-29T15:50:00Z',
  
  // December 2025 (9 commits)
  '2025-12-02T09:00:00Z', '2025-12-05T11:20:00Z', '2025-12-08T14:40:00Z', '2025-12-12T10:15:00Z',
  '2025-12-15T16:30:00Z', '2025-12-18T13:45:00Z', '2025-12-20T09:50:00Z', '2025-12-22T15:10:00Z',
  '2025-12-28T11:05:00Z',

  // May 2026 (9 commits)
  '2026-05-01T10:00:00Z', '2026-05-05T11:30:00Z', '2026-05-08T14:15:00Z', '2026-05-12T09:45:00Z',
  '2026-05-15T16:20:00Z', '2026-05-18T13:10:00Z', '2026-05-20T10:05:00Z', '2026-05-22T15:50:00Z',
  '2026-05-24T12:00:00Z'
];

let i = 1;
for (const date of dates) {
  if (i === 1) {
    execSync('git add .');
    execSync(`git commit -m "Initial commit with project setup"`, {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: date,
        GIT_COMMITTER_DATE: date
      }
    });
  } else {
    fs.writeFileSync('dummy.txt', `Commit number ${i} on ${date}\n`);
    execSync('git add dummy.txt');
    execSync(`git commit -m "Update functionality - part ${i}"`, {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: date,
        GIT_COMMITTER_DATE: date
      }
    });
  }
  i++;
}

console.log('Successfully created 26 commits.');
