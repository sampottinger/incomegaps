"""Example for using data_model.

Author: A Samuel Pottinger
License: MIT License
"""
import sys

import data_model

NUM_ARGS = 1
USAGE_STR = 'python example.py [data file loc]'


def main():
    """Main entrypoint to the script."""

    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    loc = sys.argv[1]

    dataset = data_model.load_from_file(loc)
    
    query = data_model.Query()
    query.set_educ('College')
    
    print('\n== College Graduates ==')
    print('Equivalent Hourly Wage: %f' % dataset.get_wageotc(query))
    print('Unemployment: %f' % dataset.get_unemp(query))
    print('Size: %f' % dataset.get_size(query))
    
    query.set_region('West')
    
    print('\n== College Graduates in the West ==')
    print('Equivalent Hourly Wage: %f' % dataset.get_wageotc(query))
    print('Unemployment: %f' % dataset.get_unemp(query))
    print('Size: %f' % dataset.get_size(query))
    
    query.clear_educ()
    
    print('\n== Everyone in the West ==')
    print('Equivalent Hourly Wage: %f' % dataset.get_wageotc(query))
    print('Unemployment: %f' % dataset.get_unemp(query))
    print('Size: %f' % dataset.get_size(query))


if __name__ == '__main__':
    main()
