import codecs
with open('src/App.jsx', 'r', encoding='utf8') as f:
    c = f.read()
c = c.replace('\\' + '`', '`')
c = c.replace('\\' + '$', '$')
with open('src/App.jsx', 'w', encoding='utf8') as f:
    f.write(c)
print("done")
