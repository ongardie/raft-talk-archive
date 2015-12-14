// Copyright (c) 2015 Diego Ongaro
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
// SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
// OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
// CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var childProcess = require('child_process');
var fs = require('fs');
var https = require('https');
var url = require('url');

var sourceRepo = 'ongardie/raft-talk';

var system = function(command, args, options) {
  if (options === undefined) {
    options = {};
  }
  if (options.stdio === undefined) {
    options.stdio = [undefined, 'inherit', 'inherit'];
  }
  console.log('Running', command, args);
  var st = childProcess.spawnSync(command, args, options);
  return st.status;
};

var getTagList = function(callback) {
  var options = url.parse('https://api.github.com/repos/' + sourceRepo + '/git/refs/tags');
  options.headers = {
    'User-Agent': 'node',
  };
  https.get(options, function(res) {
    var str = '';
    res.on('data', function(chunk) {
      str += chunk;
    });
    res.on('end', function() {
      callback(JSON.parse(str));
    });
  }).on('error', function(e) {
    throw e;
  });
};

getTagList(function(tagList) {
  var index = [];
  tagList.forEach(function(tag) {
    var name = tag.ref.slice('refs/tags/'.length);
    console.log(name);
    system('git', ['submodule', 'add', 'https://github.com/' + sourceRepo + '.git', name]);
    index.push('<a href="' + name + '">' + name + '</a>');
  });
  system('git', ['submodule', 'foreach', 'git checkout $path']);
  index.push('');
  fs.writeFileSync('index.html', index.join('<br />\n'));
  system('git', ['commit', '-a', '-m', 'Update submodules']);
});
