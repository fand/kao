#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const p = require('pify');
const jp = require('japanese');
const spawn = require('child_process').spawn;
const clipboardy = require('clipboardy');
const Fuse = require('fuse.js');
const width = require('string-width');
const pad = require('pad');

const meow = require('meow');
const foo = require('.');

const cli = meow(`
  Usage
    $ kao

    1. Hit 'kao'
    2. Search your kaomoji & hit enter
    3. The kaomoji is in your clipboard! ヽ(•̀﹏•́ )ゝ✧

  See https://github.com/fand/kao for details ヾ(๑╹◡╹)ﾉ"

`, {
  flags: {
    help: { type: 'boolean', alias: 'h' },
    version: { type: 'boolean', alias: 'v' },
  },
});

if (cli.flags.h) {
  cli.showHelp();
}
if (cli.flags.v) {
  console.log(cli.pkg.version);
  process.exit();
}

const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

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

    kaomojiWidth = Math.min(kaomojiWidth, 30);
    nameWidth = Math.min(nameWidth, 10);

    const fuse = new Fuse(kaomojis.map(k => ({
      kaomoji: `${pad(k[0], kaomojiWidth)}\t${pad(k[1], nameWidth)}\t${k[2]}`,
      japaneseName: k[1],
      romanName: k[2],
    })), {
      keys: ['japaneseName', 'romanName'],
      id: 'kaomoji',
    });

    return inquirer.prompt([{
      type: 'autocomplete',
      name: 'kaomoji',
      message: 'type keyword...',
      pageSize: 30,
      source: (_, input) => {
        return Promise.resolve(fuse.search(input || ''));
      },
    }]);
  })
  .then(({ kaomoji }) => {
    kaomoji = kaomoji.replace(/\t.*/, '').trim();
    clipboardy.writeSync(kaomoji);
    console.log(`>> Copied '${kaomoji}' to clipboard!`);
  })
  .catch(console.error);
