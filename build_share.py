# 신청서 HTML을 style.css·app.js·폰트까지 한 파일로 묶어 dist/ 에 저장 (메일·메신저 공유용)
# 사용: python build_share.py LG_corp.html
import base64, pathlib, sys

for name in sys.argv[1:]:
    html = pathlib.Path(name).read_text(encoding='utf-8')
    css = pathlib.Path('style.css').read_text(encoding='utf-8')
    for w in ('400', '700'):
        f = f'fonts/noto-sans-kr-korean-{w}.woff2'
        css = css.replace(f"url('{f}')", "url(data:font/woff2;base64," + base64.b64encode(pathlib.Path(f).read_bytes()).decode() + ")")
    js = pathlib.Path('app.js').read_text(encoding='utf-8')
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    html = html.replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>')
    assert 'href="style.css"' not in html and 'src="app.js"' not in html
    out = pathlib.Path('dist') / name
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding='utf-8', newline='\n')
    print(out, f'{out.stat().st_size // 1024}KB')
