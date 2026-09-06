"""Check the default Example's boundary pixels against the full screenshot height."""
import json,re,subprocess,sys,time
from pathlib import Path
from PIL import Image
import xml.etree.ElementTree as ET
adb,serial,directory=sys.argv[1:]
out=Path(directory);out.mkdir(parents=True,exist_ok=True)
def call(*args):return subprocess.check_output([adb,'-s',serial,*args])
def tree():
    call('shell','uiautomator','dump','/sdcard/screen-origin.xml')
    return ET.fromstring(call('shell','cat','/sdcard/screen-origin.xml'))
def tap(label):
    for n in tree().iter('node'):
        if label in [n.get('text'),n.get('content-desc')]:
            x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')))
            call('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(1);return
    raise AssertionError('Missing '+label)
def bounds():
    return next(n.get('bounds') for n in tree().iter('node') if n.get('resource-id')=='chat-mask-container')
def screenshot(name):
    p=out/(name+'.png');p.write_bytes(call('exec-out','screencap','-p'));return Image.open(p).convert('RGB')
def line_y(im,color):
    ys=[]
    for y in range(im.height):
        count=sum(all(abs(a-b)<10 for a,b in zip(im.getpixel((x,y)),color)) for x in range(20,im.width-20,10))
        if count > (im.width-40)/10*.8:ys.append(y)
    assert ys,'Reference line missing'
    return sum(ys)/len(ys)
original=bounds()
tap('Top 50% screen')
im=screenshot('top-screen-midpoint');top=line_y(im,(0,255,255))
assert abs(top-im.height*.5)<3,(top,im.height*.5)
tap('Bottom 100% ↔ 75%')
im=screenshot('bottom-screen-75');bottom=line_y(im,(255,85,187))
assert abs(bottom-im.height*.75)<3,(bottom,im.height*.75)
assert bounds()==original
result={'topPixelY':top,'expectedTop':im.height*.5,'bottomPixelY':bottom,'expectedBottom':im.height*.75,'containerUnchanged':True}
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
