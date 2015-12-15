var Gun, express, app, port = process.argv[2] || 3000;

Gun = require('gun-level');
express = require('express');
app = express();

Gun({
  level: {
    blaze: 'game-state'
  }
}).attach(app);

app.use('/', express['static'](__dirname));

app.listen(port, function () {
  console.log('Listening on port', port);
});