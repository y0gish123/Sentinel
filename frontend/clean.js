const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
c = c.split('\\\\' + '`').join('`');
c = c.split('\\\\' + '$').join('$');
fs.writeFileSync('src/App.jsx', c);
console.log('Done replacing.');
