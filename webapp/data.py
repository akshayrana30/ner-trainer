import sys, os, glob
import tangelo
import cherrypy
import json
import datetime
import sys
# from spacy.gold import GoldParse
import random
# import en_core_web_sm

sys.path.append('.')
from trainer.utils.file import slurp, spit

WEB_ROOT = cherrypy.config.get("webroot")
auto_save_dir = "{}/data/auto_saves".format(WEB_ROOT)
user_save_dir = "{}/data/user_saves".format(WEB_ROOT)
completed_dir = "{}/data/complete".format(WEB_ROOT)


#GET /data/last_save
def last_save(*args):
    tangelo.content_type("application/json")    
    saves=list(glob.iglob('{}/*.json'.format(auto_save_dir)))
    if len(saves) > 0:
        f= max(saves, key=os.path.getctime)
        return slurp(f)
    return { 'trainings' : [] }

def rm(filePath):
    if os.path.isfile(filePath):
        os.remove(filePath)

def remove_old_files():
    saves=list(glob.iglob('{}/*.json'.format(auto_save_dir)))
    if len(saves) > 0:
        for f in sorted(saves, key=os.path.getctime)[:-100]:
            rm(f)

#POST /data/auto_save {  } 
def auto_save(*args, **kwargs):
    cherrypy.log("saved")
    f= "session_{}.json".format(datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
    spit("{}/{}".format(auto_save_dir, f), json.dumps(kwargs))
    remove_old_files()    
    tangelo.content_type("application/json")
    return { 'saved': f }

#POST /data/server_save { 'name' : '', 'data' : trainings  } 
def server_save(*args, **kwargs):
    print("inside Server save")
    f = kwargs.get('name')
    data = kwargs.get('data')
    spit("{}/{}".format(user_save_dir, f), json.dumps(data))
    tangelo.content_type("application/json")
    return { 'saved': f }



def modify_output(default_output):
#   Code to convert MITIE output to Spacy Output.
    del default_output['filename']
    default_output = default_output['trainings']
    entity_types = set()
    correct_output = []
    for default_sample in default_output:
        correct_sample = [default_sample['text']]
        default_tags = default_sample['tags']
        correct_tags = []
        default_tokens = default_sample['tokens']
        for default_tag in default_tags:
            correct_tag = []
            start_token = default_tokens[default_tag['start']]
            start_index = start_token[1]
            correct_tag.append(start_index)
            try:
                end_token = default_tokens[default_tag['end'] - 1]
                end_index = end_token[1] + len(end_token[0])
            except IndexError:
                if default_tag['end'] == len(default_sample['text']):
                    end_index = len(default_sample['text'])
            correct_tag.append(end_index)
            correct_tag.append(default_tag['tag'])
            entity_types.add(default_tag['tag'])
            correct_tags.append(correct_tag)
        correct_sample.append(correct_tags)
        correct_output.append(correct_sample)
        # print(correct_output)
    return correct_output

#POST /data/spacy_save { 'name' : '', 'data' : trainings  } 
def spacy_save(*args, **kwargs):
    print("inside spacy save")
    f = kwargs.get('name')
    data = kwargs.get('data')
    data_spacy_format = modify_output(data)
    spit("{}/{}".format(user_save_dir, f), json.dumps(data_spacy_format))
    tangelo.content_type("application/json")
    return { 'saved': f , 'data':data_spacy_format}


def train_ner(nlp, train_data, output_dir):
    # Add new words to vocab
    for raw_text, _ in train_data:
        doc = nlp.make_doc(raw_text)
        for word in doc:
            _ = nlp.vocab[word.orth]

    for itn in range(20):
        random.shuffle(train_data)
        for raw_text, entity_offsets in train_data:
            doc = nlp.make_doc(raw_text)
            gold = GoldParse(doc, entities=entity_offsets)
            nlp.tagger(doc)
            loss = nlp.entity.update(doc, gold)
            # loss = nlp.entity.update(doc)
    nlp.end_training()
    nlp.save_to_directory(output_dir)


def train_entity_extractor(train_data):
    entity_label = 'ANIMAL'
    output_directory = 'C:\Spacy_models1'
    nlp = en_core_web_sm.load()
    nlp.entity.add_label(entity_label)
    ner = train_ner(nlp, train_data, output_directory)


def train_spacy(*args, **kwargs):
    print("inside training spacy")
    data = kwargs.get('data')
    data_spacy_format = modify_output(data)
    train_entity_extractor(data_spacy_format)
    # spit("{}/{}".format(user_save_dir, f), json.dumps(data_spacy_format))
    tangelo.content_type("application/json")
    return { 'saved': f }


def server_save(*args, **kwargs):
    print("inside server save")
    f = kwargs.get('name')
    data = kwargs.get('data')
    spit("{}/{}".format(user_save_dir, f), json.dumps(data))
    tangelo.content_type("application/json")
    return { 'saved': f }


def server_save_complete(*args, **kwargs):
    f = kwargs.get('name')
    data = kwargs.get('data')
    spit("{}/{}".format(completed_dir, f), json.dumps(data))
    tangelo.content_type("application/json")
    return { 'saved': f }

def save_tags(*args, **kwargs):
    data = kwargs.get('types')
    spit("{}/js/types_ner.json".format(WEB_ROOT), json.dumps({ 'types' : data }), True)
    return { 'saved': 'SUCCESS' }


# #POST /data/parse_tsv {'text'} 
def parse_tsv(*args, **kwargs):
    text = kwargs.get('text')
    print text
    results = []
    for arr in text:
        _id = arr[0]
        body = arr[1].encode('utf-8')
        sample = createTraining(body, _id)
        results.append(sample)
    return json.dumps({'trainings': results})


def createTraining(text, _id):
    _id = _id if _id else str(ids.next())
    tokens = tokenize_with_offsets_mod(text)
    return { 'id': _id, 'text': text, 'tokens' : tokens, 'tags': [] }


# #POST /data/create_json {'text'} 
def create_json(*args, **kwargs):
    text = kwargs.get('text')
    print text
    with open('js/types_ner.json', 'w') as outfile:
        json.dump(text, outfile)

# #POST /data/create_json2 {'text'} 
def create_json2(*args, **kwargs):
    text = kwargs.get('text')
    print text
    with open('js/types_classification.json', 'w') as outfile:
        json.dump(text, outfile)

# #POST /data/find_models  
def find_models(*args, **kwargs):
    import os
    list_models = os.listdir("../Models")
    return list_models

def tokenize_with_offsets_mod(text):
    basic_list = text.split(" ")
    main_list = []
    offset = 0
    for i in basic_list:
        inner_list = []
        inner_list.append(i)
        inner_list.append(offset)
        offset = offset + len(i) + 1
        main_list.append(inner_list)
    return main_list

def file_id(*args, **kwargs):
    id = kwargs.get('file_id')
    # Database query
    return json.dumps(id)





actions = {
    "last_save":  last_save
}

post_actions = {
    "save_tags" : save_tags,
    "auto_save" : auto_save,
    "server_save" : server_save,
    "spacy_save" : spacy_save,
    "server_save_complete" : server_save_complete,
    "train_spacy" : train_spacy,
    "parse_tsv" : parse_tsv,
    "create_json" :create_json,
    "create_json2":create_json2,
    "find_models" :find_models, 
    "file_id": file_id
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)

@tangelo.restful
def post(*args, **kwargs):

    def unknown(*args, **kwargs):
        return tangelo.HTTPStatusCode(400, "invalid service call")

    action = '.'.join(args)
    post_data = cherrypy.request.body.read()
    cherrypy.log(action)
    
    if post_data:
        #if ajax body post
        return post_actions.get(action, unknown)(*args, **json.loads(post_data))
    #else form data post
    return post_actions.get(action, unknown)(*args, **kwargs)
