Income Gaps
================================================================================
In-browser exploration of income gaps between different populations.

<br>

Purpose
--------------------------------------------------------------------------------
This interactive simulation allows users to explore differences in income across different occupations and subpopulations. This includes gender, race / ethnicity, age, education, etc. This also supports filtering and gini index.

<br>

Usage
--------------------------------------------------------------------------------
Available online at https://incomegaps.com.

<br>

Local Development Environment
--------------------------------------------------------------------------------
Simply run any local HTTP server capable of serving static files in the website folder. For example, use `python -m http.server` and navigate to http://localhost:8000/. Note that preprocessing scripts are in `preprocess`.


<br>

Testing
--------------------------------------------------------------------------------
Automated tests are avialable either by navigating to http://localhost:8000/tests/tests.html assuming one is running a server in the website folder. Automated tests can also be run via Grunt:

```
$ npm install requirements.txt
$ grunt
```

<br>

Deployment
--------------------------------------------------------------------------------
This can be deployed to any static file serving system.

<br>

Development Standards
--------------------------------------------------------------------------------
Try for 80% test coverage and jsdoc for all public members.

<br>

Open Source
--------------------------------------------------------------------------------
Code available under the [MIT license](https://mit-license.org/) (see `LICENSE.md`). Uses the following:

 - [ColorBrewer](https://colorbrewer2.org)
 - [D3 under the BSD license](https://d3js.org)
 - [Jupyter under the BSD license](https://jupyter.org/)
 - [Load Awesome under the MIT license](http://github.danielcardoso.net/load-awesome/)
 - [Numpy under the BSD license](https://numpy.org)
 - [Pandas under the BSD license](https://pandas.pydata.org)
 - [PapaParse under the MIT license](https://www.papaparse.com/)
 - [Python](https://www.python.org/)

<br>

Data
--------------------------------------------------------------------------------
We use public packaging of census data provided by the Economic Policy Insitute. We make our output data available as a CSV file.

### Citation
Uses [US Census Microdata](https://www.census.gov/programs-surveys/acs/microdata.html) samples via [EPI Microdata Extracts](https://microdata.epi.org). The live version at https://incomegaps.com indicates current timeframe in footer. Citation: Economic Policy Institute. 2025. Current Population Survey Extracts, Version 1.0.29, https://microdata.epi.org.

### Output CSV
Our [output CSV file](https://incomegaps.com/data.csv) is available under [CC-BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.en). Please also cite [EPI Microdata Extracts](https://microdata.epi.org). It contains the following columns:

 - `educ`: Education level converted to labels. This will take on the value of less than high school, high school, some college, college, and advanced.
 - `docc03`: Occupation like "computer and mathematical science occupations" as [defined by the US Census](https://www.census.gov/topics/employment/industry-occupation/guidance/code-lists.html).
 - `wageotc`: Equivalent hourly wage in USD including tips, commission, and overtime. This field contains tuples. Each value in the tuple is separated by a space and each tuple is separated by a semicolon. The first number is the value in USD and the second number is the weight which is proportional to the size of the population represented by that number.
 - `unemp`: The percent unemployement within this group as a number from 0 to 100.
 - `wageCount`: The sum of weights for this group which is comparable to other groups. This weight is propotional to the size of the population represented in this group. This reports on the sum of weights for wages but is typically the same as unempCount.
 - `unempCount`: The sum of weights for this group which is comparable to other groups. This weight is propotional to the size of the population represented in this group. This reports on the sum of weights for unemployment rates but is typically the same as wageCount.
 - `wbhaom`: Race and ethnicity label as provided by the Census. Takes on values White, Black, Hispanic, Asian, Native American, and Multiple races.
 - `female`: Gender of group as defined by Census. Indication of if the respondent's sex is listed as female. Female if yes and Male otherwise.
 - `region`: Location of group using Census region definition as converted to labels. Takes on values northeast, midwest, south, and west.
 - `age`: Age groups typically in increments of years of ten like "45-55 yr" but bounded by "<25 yr" and "65+" on other side.
 - `hoursuint`: Description of number of hours worked. Takes on values of at least 35 hours, less than 35 hours, and varies or other.
 - `citistat`: Citizenship status as defined by the US Census for this group. Take on values of "foreign born, naturalized US citizen", "foreign born, not a US citizen", "native, born abroad with American parent(s)", "native, born in Puerto Rico or other US island areas", and "native, born in US".

You may also interact with these data through Python as provided in `preprocess/data_model.py`.
