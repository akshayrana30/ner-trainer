from __future__ import unicode_literals, print_function
import json
import pathlib
import random
import en_core_web_sm
from spacy.pipeline import EntityRecognizer
from spacy.gold import GoldParse
try:
    unicode
except:
    unicode = str

def load_model(model_dir):
    model_dir = pathlib.Path(model_dir)
    nlp = en_core_web_sm.load()
    with (model_dir / 'vocab' / 'strings.json').open('r', encoding='utf8') as file_:
        nlp.vocab.strings.load(file_)
    nlp.vocab.load_lexemes(model_dir / 'vocab' / 'lexemes.bin')
    ner = EntityRecognizer.load(model_dir, nlp.vocab, require=True)
    return nlp, ner


def train_ner(nlp, train_data, entity_types):
    # Add new words to vocab.
    for raw_text, _ in train_data:
        doc = nlp.make_doc(raw_text)
        for word in doc:
            _ = nlp.vocab[word.orth]

    # Train NER.
    ner = EntityRecognizer(nlp.vocab, entity_types=entity_types)
    for itn in range(5):
        random.shuffle(train_data)
        for raw_text, entity_offsets in train_data:
            doc = nlp.make_doc(raw_text)
            gold = GoldParse(doc, entities=entity_offsets)
            ner.update(doc, gold)
    return ner


def save_model(ner, model_dir):
    model_dir = pathlib.Path(model_dir)
    if not model_dir.exists():
        model_dir.mkdir()
    assert model_dir.is_dir()
    with (model_dir / 'config.json').open('wb') as file_:
        data = json.dumps(ner.cfg)
        if isinstance(data, unicode):
            data = data.encode('utf8')
        file_.write(data)
    ner.model.dump(str(model_dir / 'model'))
    if not (model_dir / 'vocab').exists():
        (model_dir / 'vocab').mkdir()
    ner.vocab.dump(str(model_dir / 'vocab' / 'lexemes.bin'))
    with (model_dir / 'vocab' / 'strings.json').open('w', encoding='utf8') as file_:
        ner.vocab.strings.dump(file_)


def modify_output(default_output):
    default_output = default_output['data']
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


def extract_labels(train_data):
    labels = []
    for training_example in train_data:
        for label in training_example[1]:
            word = label[2]
            if word not in labels:
                labels.append(word)
    return labels


# Need to work on test-train split and return accuracy figures accordingly
# Should we give control of test-train split on UI ??
# How to display back accuracy in graphs ?? or should we annotate the test samples and show them on UI ??
def test_and_return_accuracy(test_data, nlp, ner, dir):
    if nlp == None:
        nlp, ner = load_model(dir)
        pass
    accuracy = 0
    if test_data is None:
        test_data = "Frank Krossky, an unmarried man"
    doc = nlp.make_doc(test_data)
    nlp.tagger(doc)
    ner(doc)
    for word in doc:
        print(word.text, word.i,  word.orth, word.lower, word.tag_, word.ent_type_, word.ent_iob)
    return accuracy


def train_and_save_model(train_data, model_dir):
    print("inside function")
    nlp = en_core_web_sm.load()
    ner = train_ner(nlp, train_data, extract_labels(train_data))
    save_model(ner, model_dir)
    # accuracy = test_and_return_accuracy(train_data, nlp, ner
    accuracy = 0
    return nlp, ner




