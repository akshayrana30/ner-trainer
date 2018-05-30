import Spacy_Train
import Spacy_Train2
import CRF_Train
import shutil
from flask import Flask, render_template, request, jsonify
app = Flask(__name__)
from spacy.pipeline import EntityRecognizer
from flask_cors import CORS, cross_origin

CORS(app)

dir_model = r".\Models\Model_1"
nlp = None

@cross_origin()
@app.route('/train', methods=['POST'])
def train_spacy_and_download_model(model_dir=dir_model):
    train_data = request.json
    if 'data' in train_data.keys():
        train_data = Spacy_Train.modify_output(request.json)
    global nlp, ner
    # print(train_data)
    nlp = Spacy_Train2.train_and_save_model(train_data, request.json)
    # shutil.make_archive(dir_model, 'zip', dir_model)
    return jsonify(path=model_dir, accuracy="90")

@cross_origin()
@app.route('/predict', methods=['POST'])
def predict_accuracy():
    test_data = request.json
    js = Spacy_Train2.test_and_return_accuracy(test_data['text'], nlp, dir = dir_model)
    return jsonify(js)


@cross_origin()
@app.route('/predict_ner', methods=['POST'])
def predict_ner():
    test_data = request.json
    js = Spacy_Train2.test_ner(test_data['text'],test_data['model_name'])
    return jsonify(js)


# ** NEW REQUESTS **

# @app.route('/predict', methods=['POST'])
# def test_and_return_accuracy():
#     test_data = request.json
#     text = test_data['text']
#     return jsonify(start=0, end=10, tag="Person")
#
#
# @app.route('/get_spacy_train_file', methods=['POST'])
# def download_spacy_train_file():
#     train_data = Spacy_Train.modify_output(request.json)
#     return jsonify(train_data)
#
#
# @app.route('/train_crf_download_model', methods=['POST'])
# def train_crf_and_download_model():
#     # Coming Soon
#     pass
#
#
# @app.route('/get_crf_train_file', methods=['POST'])
# def download_crf_train_file():
#     save_path = r"C:\Users\akshay.singh.rana\Desktop\akshay.singh.rana\dev"
#     filename = "demo"
#     return CRF_Train.write_train_file(request.data, save_path, filename)
#
#
# @app.route('/train_open_nlp_download_model', methods=['POST'])
# def train_open_nlp_and_download_model():
#     # Coming Soon
#     pass
#
#
# @app.route('/get_open_nlp_train_file', methods=['POST'])
# def download_open_nlp_train_file():
#     # Coming Soon
#     pass


if __name__ == '__main__':
    app.run(host = '0.0.0.0', debug=False)








