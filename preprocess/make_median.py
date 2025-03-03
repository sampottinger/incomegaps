"""Script to summarize an preprocessed data as median per record.

License: MIT
Author: A Samuel Pottinger
"""
import csv
import statistics
import sys

USAGE_STR = 'USAGE: python make_median.py [input file] []'
NUM_ARGS = 6

OUTPUT_FIELDS = [
    'educ',
    'docc03',
    'wageotc',
    'unemp',
    'wageCount',
    'unempCount',
    'wbhaom',
    'female',
    'region',
    'age',
    'hoursuint',
    'citistat'
]


def process_row(input_row):
    """Convert wageotc list to median and return updated row.

    Args:
        input_row: The row as dictionary to update. May be modified in place.

    Returns:
        Updated row after changing wageotc list to median.
    """
    wage_str = input_row['wageotc']
    wage_strs = wage_str.split(' ')
    wages = map(lambda x: float(x), wage_strs)
    wage = statistics.median(wages)
    input_row['wageotc'] = wage
    return input_row


def main():
    """Script entrypoint."""
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    input_loc = sys.argv[1]
    output_loc = sys.argv[2]

    with open(input_loc) as f_in:
        rows_in = csv.DictReader(f_in)
        rows_out = map(process_row, rows_in)

        with open(output_loc, 'w') as f_out:
            writer = csv.DictWriter(f_out, colnames=OUTPUT_FIELDS)
            writer.writeheader()
            writer.writerows(rows_out)


if __name__ == '__main__':
    main()
