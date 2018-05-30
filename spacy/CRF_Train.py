import bs4
import re
import codecs
from bs4 import BeautifulSoup
from bs4 import NavigableString
from flask import send_from_directory

def extract_html_features(node):
    parent_name = node.parent.name
    if node.parent.has_attr('class'):
        parent_class = node.parent['class']
    else:
        parent_class = 'na'
    if node.parent.has_attr('type'):
        parent_type = node.parent['type']
    else:
        parent_type = 'na'
    return parent_name, parent_class, parent_type


def generalization(token):
    isnum = 0
    numcount = 0
    hasnum = 0
    issplchar = 0
    splcharcount = 0
    hassplchar = 0
    alphareg = re.compile('\w', re.UNICODE)
    numreg = re.compile('[0-9]', re.UNICODE)
    long = []
    for i in range(len(token)):
        if re.match(alphareg, token[i]):
            if re.match(numreg, token[i]):
                long.append('1')
                hasnum = 1
                numcount = numcount + 1
            elif token[i].isupper():
                long.append('A')
            else:
                long.append('a')
        else:
            long.append('#')
            hassplchar = 1
            splcharcount = splcharcount + 1
    brief = []
    if len(long) > 0:
        temp = long[0]
        for i in range(len(long)):
            if not temp == long[i]:
                brief.append(temp)
                temp = long[i]
        brief.append(temp)
    long = ''.join(long)
    brief = ''.join(brief)
    if numcount == len(token):
        isnum = 1
    if splcharcount == len(token):
        issplchar = 1
    hasdollar = 0
    if '$' in token:
        hasdollar = 1
    hasslash = 0
    if '/' in token:
        hasslash = 1
    return long, brief, isnum, hasnum, issplchar, hassplchar, hasdollar, hasslash


def feature_extraction(node, token):
    parent_name, parent_class, parent_type = extract_html_features(node)
    long, brief, isnum, hasnum, issplchar, hassplchar, hasdollar, hasslash = generalization(token)
    parent_name = 'parent_name=' + parent_name
    parent_class = 'parent_class=' + parent_class
    parent_type = 'parent_type=' + parent_type
    long = 'long=' + long
    brief = 'brief=' + brief
    # isnum = 'isnum='+str(isnum)
    # hasnum = 'hasnum='+str(hasnum)
    # issplchar = 'issplchar='+str(issplchar)
    # hassplchar = 'hassplchar='+str(hassplchar)
    # hasdollar = 'hasdollar='+str(hasdollar)
    # hasslash = 'hasslash='+str(hasslash)
    features = '\t'.join([parent_name, parent_class, parent_type, long, brief])
    # features= '\t'.join([parent_name, parent_class, parent_type,long,brief,isnum,hasnum,issplchar,hassplchar])
    return parent_name, features


def parse_routine(soup):
    keys = []
    values = []
    features = []
    parent_name = []
    dataset = []
    blockedtags = ['script', 'option', 'button', 'wa-title']
    temp = '1234_1234'
    for n in soup.body.next_elements:
        if isinstance(n, NavigableString) and not isinstance(n, bs4.Comment) and not n.previous.name in blockedtags:
            if len(n) > 1 and not n == temp:
                keys.append([n])
                values.append(['O'])
                pn, features = feature_extraction(n, n)
                parent_name.append(pn)
                dataset.append(['O', features, n])
                temp = n
        elif n.name == "mark" and not isinstance(n.next, bs4.Tag):
            # subtype=n['subtypes'].replace('type:','').replace(';','')
            subtype = n['data-entity']
            # subtype = hierachical_entities(subtype)
            keys.append([n.next])
            values.append([subtype])
            pn, features = feature_extraction(n, n.next)
            parent_name.append(pn)
            dataset.append([subtype, features, n.next])
            temp = n.next
    return keys, values, parent_name, dataset


def write_train_file(train_data_html, save_path, filename):
    # Initializations for test
    keys = []
    values = []
    # features = []
    parent_name = []
    dataset = []
    soup = BeautifulSoup(train_data_html, 'html.parser')
    keys_tmp, values_tmp, parent_name_tmp, dataset_tmp = parse_routine(soup)
    keys.extend(keys_tmp)
    values.extend(values_tmp)
    parent_name.extend(parent_name_tmp)
    dataset.extend(dataset_tmp)
    # Pop values to lose initializtions
    # keys.pop(0); values.pop(0)
    # Saving for future reference
    keys = [k[0] for k in keys]
    values = [v[0] for v in values]
    fp = open(save_path +"/"+ filename + '.txt', 'w')
    for d in range(len(dataset)):
        if d < len(dataset) - 1:  # This condition will ignore seed initializion
            if len(dataset[d]) > 1:
                temp = '\t'.join(dataset[d]).replace('\n', '')
                fp.write(temp)
                fp.write('\n')
                if not parent_name[d + 1] == parent_name[d]:
                    fp.write('\n')
            else:
                fp.write('\n')
    fp.close()
    values = values[:-1]
    return send_from_directory(save_path, filename + '.txt')
