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
Uses [US Census Microdata](https://www.census.gov/programs-surveys/acs/microdata.html) samples via [EPI Microdata Extracts](https://microdata.epi.org). The live version at https://incomegaps.com uses April 2021 to April 2022. Citation: Economic Policy Institute. 2022. Current Population Survey Extracts, Version 1.0.29, https://microdata.epi.org.
