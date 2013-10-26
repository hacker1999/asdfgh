#-*- coding: utf-8 -*-
# Скрипт для вырузки всех писем с почтового аккаунта на mail.ru. 
# Создает в указанной папке директорию с именем почтового адреса. 
# В ней сохраняются все сообщения в виде файлов формата EML и создается файл index.json.
# Структура index.json [['Имя папки', ['id1', 'id2', 'id3', ...]], ...]
# Любые вопросы на tz4678@gmail.com
# socks.py можно скачать по ссылке http://sourceforge.net/projects/socksipy/files/latest/download
# Tor Browser Bundle можно скачать по ссылке https://www.torproject.org/projects/torbrowser.html.en
import httplib
import urllib
import sys
import re
import os
import urllib2
import json

def get_page(url):
    # try:
    req = urllib2.Request(url, None, request_headers)
    return urllib2.urlopen(req).read()
    # except:
    #     return ''

def find_messages(content):
    return re.findall('<a class="messageline__link" href="/message/(\d+)">', content)
 
def save_messages(L):
    for _ in L:
        data = get_page('https://e.mail.ru/cgi-bin/getmsg?id=' + _)
        open(save_path + _ + '.eml', 'w').write(data)

user = raw_input(u'Введите электронный адрес: ')
pswd = raw_input(u'Введите пароль: ')
# 1 - если хотите использовать TOR
using_tor = True
if using_tor:
    import socket
    import socks
    # в более ранних версиях Tor Browser Bundle использовался 9050 порт
    socks.setdefaultproxy(socks.PROXY_TYPE_SOCKS5, '127.0.0.1', 9150)
    socket.socket = socks.socksocket
print urllib2.urlopen('http://x9a.ru/ip.php').read()
request_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
}
connection = httplib.HTTPConnection('m.mail.ru')
connection.request('GET', '/cgi-bin/auth?Login=' + urllib.quote(user)+ '&Password=' + urllib.quote(pswd), headers=request_headers)
response = connection.getresponse()
response_headers = response.getheaders()
response_headers = dict(response_headers)
if response_headers['location'] != 'https://e.mail.ru/messages/inbox/?back=1':
    print u'Неправильный логин либо пароль'
    sys.exit(0)
# сохраняем куки
# Mpop единственный параметр который нужен, так что можно переписать 
pairs = re.findall(r'(?:^|(?<=, ))\w+=[^;]+', response_headers['set-cookie'])
request_headers['Cookie']  = '; '.join(pairs)
save_dir = raw_input(u'Папка для сохранения: ')
save_path = save_dir + '/' + user + '/'
try:
    os.makedirs(save_path);
except OSError:
    pass
if not os.path.isdir(save_path):
    print u'Невозможно создать папку'
    sys.exit(0)
# смотрим папки
content = get_page('https://m.mail.ru/folders/')
content = unicode(content, 'utf-8')
# черновики не нужны
folders = re.findall(r'<a href="/messages/((?!drafts)[^?]+)[^"]+" class="folder-list__item__link">(?:[\s\S]+?)<span class="folder">([\s\S]+?)</span>', content)
data2save = []
for path, name in folders:
    some_shit = [name]
    url = 'https://m.mail.ru/messages/' + path
    print url
    content = get_page(url)
    messages = find_messages(content)
    save_messages(messages)
    # узнаем количество страниц
    match = re.search(r'<td class="pager__list__item"><a href="[^"]+">(\d+)</a></td>\s+</tr>', content)
    if match:
        pages = int(match.group(1))
        # парсим остальные страницы
        i = 2
        while i <= pages:        
            content = get_page(url + '?page=' + str(i))
            _ = find_messages(content)
            save_messages(_)
            messages += _
            i += 1
    some_shit.append(messages)
    data2save.append(some_shit)
open(save_path + '/index.json', 'w').write(json.dumps(data2save, ensure_ascii=False).encode('utf-8'));
print u'Закончили'