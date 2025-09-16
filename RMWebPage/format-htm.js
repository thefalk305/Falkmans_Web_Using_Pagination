const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;
const folderPath = __dirname;
const options = {
  indent_size: 2,
  preserve_newlines: true,
  max_preserve_newlines: 2,
  wrap_line_length: 0,
  end_with_newline: true
};

fs.readdir(folderPath, (err, files) => {
  if (err) return console.error('Error reading folder:', err);

  files.forEach(file => {
    if (file.endsWith('.htm')) {
      const filePath = path.join(folderPath, file);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return console.error(`Error reading ${file}:`, err);

        const formatted = beautify(data, options);
        fs.writeFile(filePath, formatted, 'utf8', err => {
          if (err) return console.error(`Error writing ${file}:`, err);
          console.log(`Formatted: ${file}`);
        });
      });
    }
  });
});