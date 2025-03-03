"""Script to summarize an EPI microdata extract for income gaps visualization.

Script which takes in the data location file, year for which to filter, month for which to filter,
and the output CSV location after processing. Assumes educ, docc03, wageotc, wbhaom, female are
present.

License: MIT
Author: A Samuel Pottinger
"""
import os
import shutil
import statistics
import sys
import typing

import bs4
import numpy
import pandas
import requests

EPI_MICRODATA_LOC = 'https://microdata.epi.org'
USAGE_STR = 'USAGE: python process_epi_data.py [auto or dat file loc] [start year] [start month] [end year] [end month] [output loc]'
NUM_ARGS = 6
DUMP = False


def load_data(locs: typing.List[str], start_year: int, start_month: int, end_year: int,
    end_month: int) -> pandas.DataFrame:
    """Load and filter EPI data.

    Args:
        loc: The locations of the dat files.
        start_year: Integer year for which to start filtering.
        start_month: Integer month for which to start filtering.
        end_year: Integer year for which to end filtering.
        end_month: Integer month for which to end filtering.
    Returns:
        Filtered data frame for the target year / month with educ, docc03, wageotc, wbhaom, female
        included. Only returns those with a finite non-None number for wageotc.
    """
    all_data = None
    for loc in locs:
        sub_frame = pandas.read_stata(loc, convert_missing=False, preserve_dtypes=False)
        if all_data is None:
            all_data = sub_frame
        else:
            all_data = pandas.concat([all_data, sub_frame], axis=0)

    def get_month_str(target: int) -> str:
        if target < 10:
            return '0' + str(target)
        else:
            return str(target)

    start_month_str = get_month_str(start_month)
    end_month_str = get_month_str(end_month)
    min_date_str = str(start_year) + '-' + start_month_str
    max_date_str = str(end_year) + '-' + end_month_str

    def get_in_range(date_str: typing.Dict) -> bool:
        return date_str >= min_date_str and date_str <= max_date_str

    all_data['dateStr'] = all_data.apply(
        lambda x: str(x['year']) + '-' + get_month_str(x['month']),
        axis=1
    )
    target_date = all_data[all_data['dateStr'].apply(get_in_range) == True]

    with_wage = target_date[[
        'educ',
        'docc03',
        'wageotc',
        'lfstat',
        'wage',
        'wbhaom',
        'female',
        'orgwgt',
        'region',
        'citistat',
        'hoursuint',
        'age'
    ]].copy().reset_index()

    def determine_age(age_raw_str: str) -> str:
        if age_raw_str == "80+":
            age_raw = 80
        else:
            age_raw = float(age_raw_str)

        if age_raw <= 25:
            return "<25 yr"
        elif age_raw <= 35:
            return "25-35 yr"
        elif age_raw <= 45:
            return "35-45 yr"
        elif age_raw <= 55:
            return "45-55 yr"
        elif age_raw <= 65:
            return "55-65 yr"
        else:
            return "65+ yr"

    def determine_hours(target):
        return {
            '0-20 hours': 'Less than 35 Hours',
            '21-34 hours': 'Less than 35 Hours',
            '35-39 hours': 'At Least 35 Hours',
            '40 hours': 'At Least 35 Hours',
            '41-49 hours': 'At Least 35 Hours',
            '50 or more hours': 'At Least 35 Hours',
            'Hours vary: full-time': 'Varies or Other',
            'Hours vary: part-time': 'Varies or Other'
        }.get(target, 'Varies or Other')

    with_wage['age'] = with_wage['age'].apply(determine_age)
    with_wage['hoursuint'] = with_wage['hoursuint'].apply(determine_hours)

    return with_wage


def get_key(row: typing.Dict) -> str:
    """Get a composite key describing a row on which data should be aggregated.

    Args:
        row: The row for which to get a key.
    Returns:
        Key describing the group represented by a row. This key has educ, docc03, wbhaom, and
        female.
    """
    key_pieces = map(
        lambda key: row[key],
        ['educ', 'docc03', 'wbhaom', 'female', 'region', 'citistat', 'age', 'hoursuint']
    )
    key_pieces_str = map(lambda x: str(x), key_pieces)
    return '-'.join(key_pieces_str)


def agg_data(source: pandas.DataFrame) -> typing.Dict:
    """Aggregate into groups.

    Aggregate wage info by "group" where a group is the combination of educ, docc03, wbhaom, and
    female variables.

    Args:
        source: The data frame to aggregate.
    Returns:
        Dictionary mapping from group key to dictionary describing the group with individual wage
        info.
    """
    agg = {}

    for index, row in source.iterrows():
        key = get_key(row)
        if key not in agg:
            agg[key] = {
                'educ': row['educ'],
                'docc03': row['docc03'],
                'wageotc': [],
                'unemp': [],
                'wbhaom': row['wbhaom'],
                'female': row['female'],
                'region': row['region'],
                'citistat': row['citistat'],
                'age': row['age'],
                'hoursuint': row['hoursuint'],
                'wageCount': 0,
                'unempCount': 0
            }
        weight = row['orgwgt'] if numpy.isfinite(row['orgwgt']) else 0

        agg[key]['unemp'].append(
            (1 if row['lfstat'] == 'Unemployed' else 0) * weight
        )
        agg[key]['unempCount'] += weight

        if numpy.isfinite(row['wageotc']):
            agg[key]['wageotc'].append((row['wageotc'], weight))
            agg[key]['wageCount'] += weight

    return agg


def summarize_agg(agg: typing.Dict) -> typing.List[typing.Dict]:
    """Get mean wage and count for groups produced by agg_data.

    Args:
        agg: The aggregate to summarize.
    Returns:
        List of dictionaries with each dictionary describing one group.
    """
    output_rows = []

    all_records = agg.values()
    has_records = filter(lambda x: x['unempCount'] > 0, all_records)

    for record in has_records:
        if record['wageCount'] == 0:
            wages = [(0, 0)]
        else:
            wages = record['wageotc']
        
        wages.sort(key=lambda x: x[1])
        wages_strs = map(lambda x: '%f %f' % x, wages)
        wages_str = ';'.join(wages_strs)

        mean_unemployemnt = (
            sum(record['unemp']) + 0.0
        ) / record['unempCount'] * 100

        output_rows.append({
            'educ': record['educ'],
            'docc03': record['docc03'],
            'wageotc': wages_str,
            'unemp': mean_unemployemnt,
            'wageCount': record['wageCount'],
            'unempCount': record['unempCount'],
            'wbhaom': record['wbhaom'],
            'female': record['female'],
            'region': record['region'],
            'age': record['age'],
            'hoursuint': record['hoursuint'],
            'citistat': record['citistat']
        })

    return output_rows


def find_download_url(url: str = EPI_MICRODATA_LOC) -> str:
    """Find the URL where the CPS zip file can be found.

    Args:
        source_url: The URL for the microdata download page. If not given uses a default.
    Returns:
        Path to CPS zip file.
    """
    source = requests.get(url).text
    soup = bs4.BeautifulSoup(source, features="html.parser")

    links = soup.find_all('a')
    download_links = filter(lambda x: '.zip' in x['href'], links)
    cps_links = filter(lambda x: 'cpsorg' in x['href'], download_links)

    first_link = list(cps_links)[0]
    download_url = first_link['href']

    if not 'http' in download_url:
        prefix = url
        if not prefix.endswith('/'):
            prefix = prefix + '/'

        download_url = prefix + download_url

    return download_url


def download_to_tmp(url: str, output_file: str) -> str:
    """Download a file to local. If file already exists, skips.

    Args:
        output_file: Where to write the file.
    Returns:
        Path to file where downloaded.
    """
    if os.path.exists(output_file):
        return output_file

    with requests.get(url, stream=True) as inbound:
        with open(output_file, 'wb') as outbound:
            shutil.copyfileobj(inbound.raw, outbound)

    return output_file


def download_data(start_year: int, end_year: int, zip_file_loc: str = '/tmp/epi_microdata.zip',
    directory: str = '/tmp/epi_microdata') -> typing.List[str]:
    """Download latest EPI microdata and extract in /tmp directory.

    Args:
        start_year: The first year inclusive to include in the data reported to the rest of the
            script.
        end_year: The last year inclusive to include in the data reported to the rest of the
            script.
        zip_file_loc: The location to where the zip file should be written.
        directory: The directory to where the files should be extracted. If not given, uses
            default.
    Returns:
        Path to input files for the rest of the script.
    """
    target_url = find_download_url()
    actual_zip_loc = download_to_tmp(target_url, zip_file_loc)

    if not os.path.exists(directory):
        os.makedirs(directory)

    shutil.unpack_archive(actual_zip_loc, directory)

    years_range = range(start_year, end_year+1)
    years = set(map(lambda x: str(x), years_range))
    def in_matching_year(filename: str) -> bool:
        years_found = filter(lambda x: x in filename, years)
        num_found = sum(map(lambda x: 1, years_found))
        return num_found > 0

    files_available = os.listdir(directory)
    dta_files = filter(lambda x: '.dta' in x, files_available)
    matching_files = filter(in_matching_year, dta_files)
    full_path_files = map(lambda x: os.path.join(directory, x), matching_files)
    return list(full_path_files)


def main():
    """Run the summarization script using CLI arguments."""
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    input_loc = sys.argv[1]
    start_year = int(sys.argv[2])
    start_month = int(sys.argv[3])
    end_year = int(sys.argv[4])
    end_month = int(sys.argv[5])
    output_loc = sys.argv[6]

    auto_load_data = input_loc == 'auto'
    if auto_load_data:
        input_locs = download_data(start_year, end_year)
    else:
        input_locs = [input_loc]

    loaded_data = load_data(
        input_locs,
        start_year,
        start_month,
        end_year,
        end_month
    )

    if DUMP:
        loaded_data.to_csv('dump.csv')

    aggregated_data = agg_data(loaded_data)
    summarized = summarize_agg(aggregated_data)

    filtered = list(filter(
        lambda x: x['docc03'] != 'Armed Forces' and str(x['docc03']) != 'nan',
        summarized
    ))

    output_frame = pandas.DataFrame(filtered)
    output_frame.index.name = 'index'
    output_frame.to_csv(output_loc)


if __name__ == '__main__':
    main()
