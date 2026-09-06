"""Exercise the one background button in the default chat Example."""
import subprocess,re,time,sys,json
from pathlib import Path
import xml.etree.ElementTree as ET
adb,serial,out=sys.argv[1:];out=Path(out);out.mkdir(parents=True,exist_ok=True)
def call(*a):return subprocess.check_output([adb,'-s',serial,*a])
def tree():
 call('shell','uiautomator','dump','/sdcard/chat-pass-through.xml')
 return ET.fromstring(call('shell','cat','/sdcard/chat-pass-through.xml'))
def node(name):
 deadline=time.monotonic()+20
 while time.monotonic()<deadline:
  try:
   nodes=list(tree().iter('node'))
  except (subprocess.CalledProcessError, ET.ParseError):
   time.sleep(.5);continue
  for n in nodes:
   if name in [n.get('resource-id'),n.get('text'),n.get('content-desc')]:return n
  time.sleep(.5)
 raise AssertionError('Missing '+name)
def bounds(name):return list(map(int,re.findall(r'\d+',node(name).get('bounds'))))
def tap(name):
 x1,y1,x2,y2=bounds(name);call('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(1)
def count(expected):
 label=node('chat-background-taps').get('text');assert label==f'背景按鈕 · 點擊 {expected} 次',label
call('shell','am','force-stop','expo.modules.gradientmask.example');call('shell','am','start','-n','expo.modules.gradientmask.example/.MainActivity')
tap('Top 50% screen');tap('chat-background-button');count(0)
tap('Touch range: all');tap('chat-background-button');count(1)
tap('Touch range: visible');tap('chat-background-button');count(1)
tap('Touch range: all');tap('chat-background-button');count(2)
(out/'chat-button.png').write_bytes(call('exec-out','screencap','-p'))
result={'defaultBlocksBackground':True,'visibleAllowsBackground':True,'switchBackBlocksAgain':True,'switchOnAgainWorks':True,'backgroundTaps':2}
(out/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
