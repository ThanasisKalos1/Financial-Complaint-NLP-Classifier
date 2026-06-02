# Financial Complaint NLP Assistant

This project uses consumer financial complaint narratives to build toward an NLP system that can classify complaints by product category and support complaint triage.

The current work focuses on exploratory data analysis of the processed complaint dataset. The EDA checks data quality, class balance, narrative length, important terms, and category overlap before moving into modeling.

## Project Status

Completed:

- Data setup instructions
- Exploratory data analysis notebook
- Class distribution review
- Text length analysis
- TF-IDF term analysis
- Word clouds by product category
- Modeling recommendations

Next planned step:

- Build a baseline text classifier using TF-IDF and Logistic Regression or Linear SVM.

## Repository Structure

```text
financial-complaint-nlp-genai-assistant/
+-- notebooks/
|   +-- EDA.ipynb
+-- README.md
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
financial-complaint-nlp-genai-assistant/
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

## Modeling Plan

The next notebook should include:

- Cleaning missing or empty complaint narratives
- Stratified train/test split
- TF-IDF vectorization with unigrams and bigrams
- Logistic Regression or Linear SVM baseline
- Macro F1, weighted F1, and per-class recall
- Confusion matrix and error analysis

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
```
