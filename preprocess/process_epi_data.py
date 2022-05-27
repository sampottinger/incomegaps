"""Script to summarize an EPI microdata extract for income gaps visualization.

Script which takes in the data location file, year for which to filter, month for which to filter,
and the output CSV location after processing. Assumes educ, docc03, wageotc, wbhaom, female are
present.

License: MIT
Author: A Samuel Pottinger
"""
import os
import statistics
import sys
import typing

import numpy
import pandas

USAGE_STR = 'USAGE: python process_epi_data.py [auto or dat file loc] [start year] [start month] [end year] [end month] [output loc]'
NUM_ARGS = 6
DUMP = False


def load_data(loc: str, start_year: int, start_month: int, end_year: int,
    end_month: int) -> pandas.DataFrame:
    """Load and filter EPI data.

    Args:
        loc: The location of the dat file.
        start_year: Integer year for which to start filtering.
        start_month: Integer month for which to start filtering.
        end_year: Integer year for which to end filtering.
        end_month: Integer month for which to end filtering.
    Returns:
        Filtered data frame for the target year / month with educ, docc03, wageotc, wbhaom, female
        included. Only returns those with a finite non-None number for wageotc.
    """
    all_data = pandas.read_stata(loc, convert_missing=False, preserve_dtypes=False)

    def get_in_range(target: typing.Dict) -> bool:
        month = target['month']
        month_in_range = month >= start_month and month <= end_month

        year = target['year']
        year_in_range = year >= start_year and year <= end_year

        return month_in_range and year_in_range

    target_date = all_data[all_data.apply(get_in_range, axis=1)]

    var_subset = target_date[[
        'educ',
        'docc03',
        'wageotc',
        'wage',
        'wbhaom',
        'female',
        'orgwgt',
        'region',
        'citistat',
        'age'
    ]];
    with_wage = var_subset[
        var_subset['wageotc'].apply(lambda x: numpy.isfinite(x))
    ].copy().reset_index()

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

    with_wage['age'] = with_wage['age'].apply(determine_age)

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
        ['educ', 'docc03', 'wbhaom', 'female', 'region', 'citistat', 'age']
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
                'enemp': [],
                'wbhaom': row['wbhaom'],
                'female': row['female'],
                'region': row['region'],
                'citistat': row['citistat'],
                'age': row['age'],
                'count': 0
            }
        weight = row['orgwgt'] if numpy.isfinite(row['orgwgt']) else 0
        agg[key]['wageotc'].append(row['wageotc'] * weight)
        agg[key]['unemp'].append(row['unemp'] * weight)
        agg[key]['count'] += weight

    return agg


def summarize_agg(agg: typing.Dict) -> typing.List[typing.Dict]:
    """Get mean wage and count for groups produced by agg_data.

    Args:
        agg: The aggregate to summarize.
    Returns:
        List of dictionaries with each dictionary describing one group.
    """
    output_rows = []

    for record in agg.values():
        if record['count'] > 0:
            mean_wage = sum(record['wageotc']) / record['count']
            mean_unemployemnt = sum(record['unemp']) / record['count']
            output_rows.append({
                'educ': record['educ'],
                'docc03': record['docc03'],
                'wageotc': mean_wage,
                'enemp': mean_unemployemnt,
                'count': record['count'],
                'wbhaom': record['wbhaom'],
                'female': record['female'],
                'region': record['region'],
                'age': record['age'],
                'citistat': record['citistat']
            })

    return output_rows


def download_data() -> str:
    """Download latest EPI microdata and extract.

    Returns:
        Path to input file for the rest of the script.
    """
    pass


def main():
    """Run the summarization script using CLI arguments."""
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    input_loc = sys.argv[1]

    auto_load_data = input_loc == 'auto'
    if auto_load_data:
        input_loc = download_data()

    start_year = maybe_convert(sys.argv[2])
    start_month = maybe_convert(sys.argv[3])
    end_year = maybe_convert(sys.argv[4])
    end_month = maybe_convert(sys.argv[5])
    output_loc = sys.argv[6]

    loaded_data = load_data(
        input_loc,
        start_year,
        start_month,
        end_year,
        end_month
    )

    if DUMP:
        loaded_data.to_csv('dump.csv')
    
    aggregated_data = agg_data(loaded_data)
    summarized = summarize_agg(aggregated_data)

    pandas.DataFrame(summarized).to_csv(output_loc)


if __name__ == '__main__':
    main()
