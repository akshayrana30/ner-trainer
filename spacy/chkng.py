import spacy
import random
dir_model = r"C:\NER TRAINER\NER-trainer-master\model"
from spacy.gold import GoldParse, biluo_tags_from_offsets
import en_core_web_sm

TRAIN_DATA = train_data = [
        (
            'Who is Shaka Khan?',
            [(len('Who is '), len('Who is Shaka Khan'), 'GRANTOR')]
        ),
        (
            'I like London and Berlin.',
            [(len('I like '), len('I like London'), 'LOCATION'),
            (len('I like London and '), len('I like London and Berlin'), 'LOCATION')]
        )
    ]
#
# cls = spacy.util.get_lang_class('en')   # 1. get Language instance, e.g. English()
# nlp = cls()
#
# nlp = spacy.load('en', parser=False, entity=False, add_vectors=False)
nlp = spacy.load('en_core_web_sm', disable=['parser'])
ner = nlp.get_pipe('ner')

for _, annotations in TRAIN_DATA:
    for ent in annotations:
        print(ent[2])
        ner.add_label(ent[2])


other_pipes = [pipe for pipe in nlp.pipe_names if pipe != 'ner']
with nlp.disable_pipes(*other_pipes):  # only train NER
    optimizer = nlp.begin_training()
    for itn in range(100):
        random.shuffle(TRAIN_DATA)
        losses = {}
        for text, annotations in TRAIN_DATA:
            doc = nlp.make_doc(text)
            gold = GoldParse(doc, entities=annotations)
            nlp.update(
                [text],  # batch of texts
                [gold],  # batch of annotations
                drop=0.5,  # dropout - make it harder to memorise data
                sgd=optimizer,  # callable to update weights
                losses=losses)
        print(losses)

# test the trained model
for text, _ in TRAIN_DATA:
    doc = nlp(text)
    arr = []
    for ent in doc.ents:
        js = {"start":ent.start, "end":ent.end, "tag":ent.label_, "text" : ent.text}
        arr.append(js)
    print(arr)

output_dir = ""
if output_dir is not None:
        output_dir = Path(output_dir)
        if not output_dir.exists():
            output_dir.mkdir()
        nlp.to_disk(output_dir)
        print("Saved model to", output_dir)

        # test the saved model
        print("Loading from", output_dir)
        nlp2 = spacy.load(output_dir)
        for text, _ in TRAIN_DATA:
            doc = nlp2(text)
            print('Entities', [(ent.text, ent.label_) for ent in doc.ents])
            print('Tokens', [(t.text, t.ent_type_, t.ent_iob) for t in doc])


from spacy.lang.en import English
from spacy.pipeline import EntityRecognizer

# nlp = en_core_web_sm.load()
# ner = EntityRecognizer(nlp.vocab)
# ner = English()
# doc = nlp.make_doc('I like London.')
# entities = [(7, 13, 'LOC')]
# gold = GoldParse(doc, entities=entities)
# tags = biluo_tags_from_offsets(doc,entities)
# print(tags)
# print(gold.tags)
# print(gold.labels)

# optimizer = ner.begin_training()
# for itn in range(100):
#     random.shuffle(TRAIN_DATA)
#     for raw_text, entity_offsets in TRAIN_DATA:
#         doc = nlp.make_doc(raw_text)
#         print(doc)
#         gold = GoldParse(doc, entities=entity_offsets)
#         print(gold.tags)
#         ner.update([doc], [gold], sgd=optimizer)
# # ner.to_disk(dir_model)
# #
#
# # nlp2 = spacy.load(dir_model)
# for text, _ in TRAIN_DATA:
#     doc = ner(text)
#     print('Entities', [(ent.text, ent.label_) for ent in doc.ents])
#     print('Tokens', [(t.text, t.ent_type_, t.ent_iob) for t in doc])
#

