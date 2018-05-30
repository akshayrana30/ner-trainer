from __future__ import unicode_literals, print_function
import json
import pathlib
import random
import en_core_web_sm
import spacy
from spacy.pipeline import EntityRecognizer
from spacy.gold import GoldParse

path = "./models/"

def extract_labels(train_data):
    labels = []
    for training_example in train_data:
        for label in training_example[1]:
            word = label[2]
            if word not in labels:
                labels.append(word)
    return labels


def train_and_save_model(TRAIN_DATA, input_json):
    iterations = input_json['iteration']
    model_dir = input_json['path_to']
    model_load = ''

    if input_json['update']:
        model_load = input_json['path_from']
        nlp = spacy.load(path+model_load)
    else:
        # nlp = spacy.load('en_core_web_sm', disable=['parser'])
        nlp = spacy.blank('en')

    if 'ner' not in nlp.pipe_names:
        ner = nlp.create_pipe('ner')
        nlp.add_pipe(ner, last=True)
    else:
        ner = nlp.get_pipe('ner')

    print("*** TRAINING DATA ***")
    for text, annotations in TRAIN_DATA:
        for ent in annotations:
            print(text[ent[0]:ent[1]], "--> ", ent[2])
            # print(ent[2])
            ner.add_label(ent[2])

    other_pipes = [pipe for pipe in nlp.pipe_names if pipe != 'ner']
    with nlp.disable_pipes(*other_pipes):  # only train NER
        optimizer = nlp.begin_training()
        for itn in range(50):
            random.shuffle(TRAIN_DATA)
            losses = {}
            for text, annotations in TRAIN_DATA:
                doc = nlp.make_doc(text)
                gold = GoldParse(doc, entities=annotations)
                # print(doc)
                # print(gold.tags)
                # print(gold.labels)

                nlp.update(
                    [text],  # batch of texts
                    [gold],  # batch of annotations
                    drop=0.5,  # dropout - make it harder to memorise data
                    sgd=optimizer,  # callable to update weights
                    losses=losses)
            print(losses)
            if (losses['ner'] < 0.01):
                break

    nlp.to_disk(path+model_dir)
    print("*** TESTING DATA ***")

    nlp2 = spacy.load(path+model_dir)
    for text, _ in TRAIN_DATA:
        doc = nlp2(text)
        print('Sentence -> '+text)
        print('Entities', [(ent.text, ent.label_) for ent in doc.ents])
    return nlp


def test_and_return_accuracy(test_data, nlp, dir):
    if nlp is None:
        nlp = spacy.load(dir)
    doc = nlp(test_data)
    arr = []
    for ent in doc.ents:
        js = {"start": ent.start, "end": ent.end, "tag": ent.label_, "text": ent.text}
        arr.append(js)
    return arr


def test_ner(text, model_name):
    nlp2 = spacy.load(path + model_name)
    doc = nlp2(text)
    print(text)
    print('Entities', [(ent.text, ent.label_) for ent in doc.ents])
    entities =  [{"text":ent.text, "label":ent.label_} for ent in doc.ents];
    print(entities)
    return entities



