'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');

test('sales site and planner only reference present local assets', () => {
  for (const file of ['index.html', 'workspace.html']) {
    const html = fs.readFileSync(path.join(site, file), 'utf8');
    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const reference of references) {
      if (/^(https?:|mailto:|#)/.test(reference)) continue;
      const target = path.resolve(site, reference.replace(/^\.\//, ''));
      assert.equal(fs.existsSync(target), true, `${file} references missing ${reference}`);
    }
  }
});

test('web capability copy does not imply desktop control', () => {
  const planner = fs.readFileSync(path.join(site, 'workspace.html'), 'utf8');
  const plannerCode = fs.readFileSync(path.join(site, 'workspace.js'), 'utf8');
  assert.match(planner, /cannot read your computer, run commands/);
  assert.match(plannerCode, /requiresDesktopApproval: true/);
});
