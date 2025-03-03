"""Test the preprocessed EPI data and the query logic.

Author: A Samuel Pottinger
License: MIT License
"""
import sys

import data_model

USAGE_STR = 'python test_data.py [csv loc]'
NUM_ARGS = 1


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    loc = sys.argv[1]
    dataset = data_model.load_from_file(loc)

    query = data_model.Query()
    query.set_educ('College')

    assert dataset.get_wageotc(query) > 0
    assert dataset.get_unemp(query) > 0
    assert dataset.get_size(query) > 0

    query.set_region('West')

    assert dataset.get_wageotc(query) > 0
    assert dataset.get_unemp(query) > 0
    assert dataset.get_size(query) > 0

    query.clear_educ()

    assert dataset.get_wageotc(query) > 0
    assert dataset.get_unemp(query) > 0
    assert dataset.get_size(query) > 0

    assert dataset.get_max_wage() > 0
    assert dataset.get_max_unemployment() > 0

    assert len(dataset.get_educ_vals()) > 0
    assert len(dataset.get_docc03_vals()) > 0
    assert len(dataset.get_wbhaom_vals()) > 0
    assert len(dataset.get_female_vals()) > 0
    assert len(dataset.get_region_vals()) > 0
    assert len(dataset.get_age_vals()) > 0
    assert len(dataset.get_hoursuint_vals()) > 0
    assert len(dataset.get_citistat_vals()) > 0


if __name__ == '__main__':
    main()
