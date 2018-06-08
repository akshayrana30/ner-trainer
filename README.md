# NER TRAINER

This is a NER Trainer coupled with spacy as the backend and used to generate quick models after annotating few samples.. 

## Quick Start

Make sure you've got these programs installed:
* Spacy 
* Tangelo 

1. Start the web interface with this command. 
> tangelo --root ./webapp --port 4000
2. Start the spacy backend for training the models.
> python spacy\app.py
3. Point you browser at http://localhost:4000 and you should see the below screen !!

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_1.PNG"/>


## Getting Started

1. Click on _Import Training_ and select the _input.json_ file from the repo. 

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_2.PNG"/>

2. Click on the training data and start annotating by selecting the tag and the word by pressing **T** on your keyboard.

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_3.PNG"/>

3. You can add more tags by hitting the **+** button and type in the name of the label of your choice.

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_4.PNG"/>
<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_4.1.PNG"/>

4. On completetion, click on _Train Model_ and select _New Model_ and start training.

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_5.PNG"/>

5. On backend, you will see the training data is extracted in the form of spacy and the model is trained and tested.

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_6.PNG"/>
<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_7.PNG"/>

6. You can even test the trained models by selecting the model from the list and by feeding any input.

<img src = "https://raw.githubusercontent.com/akshayrana1139/ner-trainer/master/img/Screen_8.PNG"/>


## Download Training

In case you just need the annotated data and dont want to train any models, click on **Download Training**, which will download two files, one in spacy format and the other in format of the trainer which can be fed again to this tool using _Import Training_


## Experimental Feature

Enable the **Tag For Me** checkbox which will automatically train the models while you are tagging and then start self annotating the training data for you, thus speeding up the annotation work.
