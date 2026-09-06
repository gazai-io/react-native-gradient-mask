"""Run against the Release Example built with EXPO_PUBLIC_MASK_VALIDATION=touch.
Usage: python3 tests/android/touch_range.py /path/to/adb emulator-5554 /tmp/output
"""
import json, re, subprocess, sys, time
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image
adb, serial, output = sys.argv[1:]
out = Path(output); out.mkdir(parents=True, exist_ok=True)
package = 'expo.modules.gradientmask.example'
results = []
def call(*args): return subprocess.check_output([adb, '-s', serial, *args])
def tree():
    call('shell', 'uiautomator', 'dump', '/sdcard/gradient-mask-touch.xml')
    return ET.fromstring(call('shell', 'cat', '/sdcard/gradient-mask-touch.xml'))
def node(identifier):
    deadline=time.monotonic()+20
    while time.monotonic()<deadline:
        for element in tree().iter('node'):
            if element.get('resource-id') == identifier: return element
        time.sleep(.5)
    raise AssertionError('Missing ' + identifier)
def bounds(identifier): return list(map(int, re.findall(r'\d+', node(identifier).get('bounds'))))
def tap(identifier):
    x1,y1,x2,y2 = bounds(identifier)
    call('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
def status():
    text = node('touch-status').get('text')
    return dict((k,int(v)) for k,v in re.findall(r'(content|background|offset)=(\d+)', text))
def check(name, **expected):
    actual = status()
    assert all(actual[k] == v for k,v in expected.items()), (name, expected, actual)
    results.append({'case':name,'actual':actual,'pass':True})
def reset():
    call('shell','am','force-stop',package)
    call('shell','am','start','-n',package+'/.MainActivity')
    time.sleep(1)
    global host
    host=bounds('touch-host')
def point(y):return [str((host[0]+host[2])//2), str(round(host[1]+(host[3]-host[1])*y/400))]
def tap_y(y):call('shell','input','tap',*point(y))
def screenshot(name):
    p=out/(name+'.png');p.write_bytes(call('exec-out','screencap','-p'));return p
try:
    reset()
    tap_y(25);check('default hidden row remains interactive',content=1,background=0)
    tap('toggle-restrict')
    tap_y(25);check('restricted top passes to background',content=1,background=1)
    tap_y(325);check('restricted bottom passes to background',content=1,background=2)
    tap_y(125);check('feather remains interactive',content=2,background=2)
    tap('toggle-bounds');tap_y(125);check('shared boundary update affects hit test',content=2,background=3)
    tap('toggle-mask');tap_y(25);check('disabled mask bypasses restriction',content=3,background=3)
    tap('toggle-mask');tap('toggle-restrict');tap_y(325);check('restriction can be disabled again',content=4,background=3)
    screenshot('touch-taps')
    reset();tap('toggle-restrict');tap('toggle-wrapper')
    tap_y(25);check('auto ancestor blocks underlying sibling despite mask restriction',content=0,background=0)
    tap('toggle-wrapper');tap_y(25);tap_y(325)
    check('box-none ancestor allows both edges to reach underlying sibling',content=0,background=2)
    reset();tap('toggle-restrict')
    call('shell','input','swipe',*point(25),*point(200),'450');check('outside drag start rejected',offset=0)
    call('shell','input','swipe',*point(200),*point(25),'450')
    actual=status();assert actual['offset']>50,actual
    results.append({'case':'inside drag continues outside','actual':actual,'pass':True})
    screenshot('touch-drag')
    reset();tap('percent-bounds');tap('toggle-restrict')
    tap_y(125);tap_y(325);check('container percentage boundaries gate both ends',content=1,background=1)
    original_host=host[:]
    tap('toggle-reference');tap_y(125);tap_y(325);check('screen percentage boundaries gate both ends',content=2,background=2)
    tap('separate-bounds');tap_y(125);tap_y(325);check('boundary reference overrides common screen setting',content=3,background=3)
    assert bounds('touch-host')==original_host
    screenshot('boundary-percentage')
    reset()
    x1,y1,x2,y2=bounds('reference-oracle')
    sample=((x1+x2)//2,round(y1+(y2-y1)*30/120))
    before=screenshot('percentage-container')
    tap('toggle-reference')
    assert 'screen' in node('toggle-reference').get('content-desc')
    after=screenshot('percentage-screen')
    a=min(Image.open(before).convert('RGB').getpixel(sample))
    b=min(Image.open(after).convert('RGB').getpixel(sample))
    assert b<a-30,(a,b)
    assert bounds('reference-oracle')==[x1,y1,x2,y2]
    results.append({'case':'screen reference changes percentage, fixed container','containerPixel':a,'screenPixel':b,'pass':True})
finally:
    (out/'results.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
