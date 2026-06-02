# Financial Complaint NLP Classifier

This project uses consumer financial complaint narratives to build an NLP classifier that predicts the financial product category of each complaint and supports complaint triage.

The current version is a classical NLP classification project. A GenAI assistant layer is future work, not part of the current implementation. The classifier creates the routing layer that a future assistant could use.

The workflow starts with exploratory data analysis of the processed complaint dataset, then compares Bag of Words and TF-IDF baselines before selecting a tuned Linear SVM model.

## Business Value

Financial institutions receive large volumes of customer complaints across products such as credit cards, banking, mortgages, credit reporting, and debt collection. A classifier like this can help:

- Route complaints to the correct product or operations team
- Reduce manual triage effort
- Identify recurring product or servicing issues
- Support compliance monitoring and complaint trend analysis
- Prioritize error review for complaint categories that are often confused

## How to Read This Project

Start with the notebooks in this order:

1. [EDA notebook](notebooks/EDA.ipynb)
   - Understand the dataset, class imbalance, duplicate records, text length, and important terms.
2. [Modeling notebook](notebooks/Modeling.ipynb)
   - Train a baseline classifier using the choices motivated by the EDA.

The project flow is:

```text
raw complaint narratives
-> EDA and data quality checks
-> remove missing and duplicate text
-> compare Bag of Words and TF-IDF baselines
-> tune the top 3 validation models
-> evaluate the selected model
-> save the classifier locally
-> run prediction examples
-> confusion matrix and error review
```

## Future GenAI Work

The current project is intentionally focused on the classification layer. A future GenAI extension could use the predicted product category to:

- Route the complaint to a product-specific knowledge base
- Retrieve relevant policy or compliance context
- Draft a first-pass complaint summary
- Suggest the correct operations or compliance team
- Support human review rather than replacing it

This future layer would be built on top of the classifier, not instead of it.

## Project Status

Completed:

- Data setup instructions
- Exploratory data analysis notebook
- Class distribution review
- Text length analysis
- TF-IDF term analysis
- Word clouds by product category
- Modeling recommendations
- Bag of Words and TF-IDF baseline comparison
- Top 3 model tuning using validation macro F1
- Final selected complaint classification model
- Saved model generation and prediction examples

Next planned step:

- Add deeper error analysis for the most confused product-category pairs.

## Repository Structure

```text
financial-complaint-nlp-classifier/
+-- notebooks/
|   +-- EDA.ipynb
|   +-- Modeling.ipynb
+-- models/
|   +-- README.md
+-- README.md
+-- requirements.txt
+-- LICENSE
+-- .gitignore
```

## Data Setup

This project uses a Kaggle dataset. Data files are not included in the repository.

Download the dataset from Kaggle and place the file in the project root:

- Dataset: [Consumer Complaints Dataset for NLP](https://www.kaggle.com/datasets/shashwatwork/consume-complaints-dataset-fo-nlp)
- File used: `complaints_processed.csv`

Expected local layout:

```text
financial-complaint-nlp-classifier/
+-- complaints_processed.csv
+-- notebooks/
    +-- EDA.ipynb
```

The EDA notebook reads the data with:

```python
data_path = '../complaints_processed.csv'
```

So run `notebooks/EDA.ipynb` from inside the `notebooks/` folder or open it normally in Jupyter from the project directory.

Data files are listed in `.gitignore` and should not be committed.

## Notebook

- [EDA notebook](notebooks/EDA.ipynb)
- [Modeling notebook](notebooks/Modeling.ipynb)

The EDA notebook includes:

- Dataset shape and missing value checks
- Duplicate and short-text checks
- Product category distribution
- Class imbalance calculation
- Complaint length analysis
- High-signal TF-IDF terms and bigrams
- Category overlap review
- Word clouds for each product category
- Modeling recommendations

## EDA Highlights

- The full dataset contains 162,421 complaints across 5 product categories.
- `credit_reporting` is the largest class, creating a clear class imbalance.
- Missing complaint narratives are minimal.
- Bigrams are more useful than single words for separating product categories.
- Banking-related categories share vocabulary and may need closer error analysis during modeling.

## Modeling Summary

The modeling notebook includes:

- Cleaning missing or empty complaint narratives
- Removing exact duplicate narratives before splitting
- Stratified train/test split
- Bag of Words and TF-IDF text features
- Comparison of Dummy, Naive Bayes, SGD, Logistic Regression, and Linear SVM models
- Top 3 model selection before tuning
- Model selection using validation macro F1
- Macro F1, weighted F1, and per-class recall
- Saved model generation with `joblib`
- Example predictions on new complaint text
- Confusion matrix and error analysis

Selected model:

- Model: `TFIDF_LinearSVC_ngram(1, 3)_min3_C0.5`
- Macro F1: 0.85
- Weighted F1: 0.86
- Error rate: 13.66%

The selected model is a TF-IDF + Linear SVM classifier using unigrams, bigrams, and trigrams. It was selected because it had the best validation macro F1 among the tested baseline models.

How to interpret this:

- Macro F1 gives each class equal weight, so it is important for this imbalanced dataset.
- Weighted F1 accounts for class size and is useful for overall model performance.
- The gap between macro F1 and weighted F1 shows that minority classes still need attention.
- The confusion matrix should be used to find which product categories overlap the most.

After removing exact duplicate narratives, the baseline is a more honest estimate of model performance because the same complaint text is less likely to appear in both training and test data.

## Model Artifact

The modeling notebook saves the selected classifier locally:

```text
models/complaint_classifier.joblib
```

The artifact is ignored by Git because it can be regenerated from the notebook and may become large.

## Requirements

Main Python packages used:

```text
pandas
numpy
matplotlib
seaborn
scikit-learn
wordcloud
jupyter
joblib
```

Install them with:

```bash
pip install -r requirements.txt
```
