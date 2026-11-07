"""Construit les fichiers publiés comme artefact claude.ai :
 - deux-cotes.html : page principale sans squelette (title + meta + fonts + style inline + corps), moteur inline
 - salaire.html    : page secondaire complète (doctype), style et moteur inline
"""
import re, sys, pathlib
proj = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
css = (proj / 'style.css').read_text(encoding='utf-8')
calc = (proj / 'calc.js').read_text(encoding='utf-8')

def inline(src):
    src = src.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    assert '<script src="calc.js"></script>' in src
    return src.replace('<script src="calc.js"></script>', '<script>\n' + calc + '\n</script>')

# page principale : squelette fourni par l'artefact
index = (proj / 'index.html').read_text(encoding='utf-8')
title = re.search(r'<title>.*?</title>', index).group(0)
fonts = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>', index).group(0)
body = re.search(r'<body>\n(.*)\n</body>', index, re.S).group(1)
body = inline(body.replace('<link rel="stylesheet" href="style.css">', ''))
main = title + '\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>\n' + css + '\n</style>\n\n' + body + '\n'
(out / 'deux-cotes.html').write_text(main, encoding='utf-8')

# page secondaire : document complet
sal = (proj / 'salaire.html').read_text(encoding='utf-8')
(out / 'salaire.html').write_text(inline(sal), encoding='utf-8')
print('ok', (out / 'deux-cotes.html').stat().st_size, (out / 'salaire.html').stat().st_size)
