#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const p = require('pify');
const jp = require('japanese');
const spawn = require('child_process').spawn;
const width = require('string-width');
const pad = require('pad');
const clipboardy = require('clipboardy');

const configs = ['wikipedia', 'traditional hepburn', 'modified hepburn', 'kunrei', 'nihon'];

p(fs.readFile)(path.resolve(__dirname, 'emoticon.txt'), 'utf8')
  .then(src => {
    const lines = src.trim().split('\n');

    let kaomojiWidth = 0;
    let nameWidth = 0;

    const kaomojis = lines.map(line => {
      const m = line.match(/^@(.*)\t(.*)\t(.*)$/);
      if (!m) { return; }

      const [_, name, kaomoji] = m;

      const namesHash = {};
      configs.forEach(c => {
        const roman = jp.romanize(name, c);
        namesHash[roman] = true;
      });
      const names = Object.keys(namesHash).join(', ');

      kaomojiWidth = Math.max(kaomojiWidth, width(kaomoji));
      nameWidth = Math.max(nameWidth, width(name));

      return [kaomoji, name, names];
    }).filter(x => x);

    kaomojiWidth = Math.min(40);
    nameWidth = Math.min(10);

    const candidates = kaomojis.map(([k, j, r]) => `${pad(k, kaomojiWidth)}\t${pad(j, nameWidth)}\t${r}`);

    return new Promise(resolve => {
      const p = spawn('peco', { stdio: 'pipe' });
      p.stdin.setEncoding('utf-8');
      p.stdout.setEncoding('utf-8');
      p.stdout.on('data', resolve);
      p.stdin.write(candidates.join('\n'));
    });
  })
  .then(data => {
    const kao = data.replace(/\t.*/, '').trim();
    clipboardy.writeSync(kao);
    console.log(`>> Moved '${kao}' to clipboard!`);
  })
  .catch(console.error);
