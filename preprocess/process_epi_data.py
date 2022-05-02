"""Script to summarize an EPI microdata extract for income gaps visualization.

Script which takes in the data location file, year for which to filter, month for which to filter,
and the output CSV location after processing. Assumes educ, docc03, wageotc, wbhaom, female are
present.

License: MIT
Author: A Samuel Pottinger
"""

import statistics
import sys
import typing

import numpy
import pandas

USAGE_STR = 'python [dat file loc] [year] [month] [output loc]'
NUM_ARGS = 4
DUMP = False


def load_data(loc: str, year: int, month: int) -> pandas.DataFrame:
    """Load and filter EPI data.

    Args:
        loc: The location of the dat file.
        year: Integer year for which to filter.
        month: Integer month for which to filter
    Returns:
        Filtered data frame for the target year / month with educ, docc03, wageotc, wbhaom, female
        included. Only returns those with a finite non-None number for wageotc.
    """
    all_data = pandas.read_stata(loc, convert_missing=False, preserve_dtypes=False)

    if year == 'all':
        target_year = all_data
    else:
        target_year = all_data[all_data['year'] == year]

    if month == 'all':
        target_date = target_year
    else:
        target_date = target_year[target_year['month'] == month]

    var_subset = target_date[['educ', 'docc03', 'wageotc', 'wage', 'wbhaom', 'female', 'orgwgt']]
    with_wage = var_subset[
        var_subset['wageotc'].apply(lambda x: numpy.isfinite(x))
    ].copy().reset_index()

    return with_wage


def get_key(row: typing.Dict) -> str:
    """Get a composite key describing a row on which data should be aggregated.

    Args:
        row: The row for which to get a key.
    Returns:
        Key describing the group represented by a row. This key has educ, docc03, wbhaom, and
        female.
    """
    key_pieces = map(lambda key: row[key], ['educ', 'docc03', 'wbhaom', 'female'])
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
                'wbhaom': row['wbhaom'],
                'female': row['female'],
                'count': 0
            }
        weight = row['orgwgt'] if numpy.isfinite(row['orgwgt']) else 0
        agg[key]['wageotc'].append(row['wageotc'] * weight)
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
            output_rows.append({
                'educ': record['educ'],
                'docc03': record['docc03'],
                'wageotc': mean_wage,
                'count': record['count'],
                'wbhaom': record['wbhaom'],
                'female': record['female']
            })

    return output_rows


def main():
    """Run the summarization script using CLI arguments."""
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return

    maybe_convert = lambda x: 'all' if x == 'all' else int(x)

    input_loc = sys.argv[1]
    year = maybe_convert(sys.argv[2])
    month = maybe_convert(sys.argv[3])
    output_loc = sys.argv[4]

    loaded_data = load_data(input_loc, year, month)
    if DUMP:
        loaded_data.to_csv('dump.csv')
    aggregated_data = agg_data(loaded_data)
    summarized = summarize_agg(aggregated_data)

    pandas.DataFrame(summarized).to_csv(output_loc)


if __name__ == '__main__':
    main()
