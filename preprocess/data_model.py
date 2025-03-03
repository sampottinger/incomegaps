"""Tools to perform calculations on preprocessed EPI data.

Author: A Samuel Pottinger
License: MIT License
"""
import csv
import functools


class WageTuple:
    """Record representing a tuple for wage information."""

    def __init__(self, wage, weight):
        """
        Initialize the WageTuple with wage and weight.

        Args:
            wage (float): The wage amount.
            weight (float): The weight associated with the wage.
        """
        self._wage = wage
        self._weight = weight

    def get_wage(self):
        """Retrieve the wage value.

        Returns:
            float: Wage with overtime, comissions, and bonus as USD.
        """
        return self._wage

    def get_weight(self):
        """Get the population weight associated with this wage.

        Returns:
            float: Weight proportional to population size.
        """
        return self._weight


class InputRecord:
    """A representation of an income dataset record."""

    def __init__(self, index, educ, docc03, wageotc, unemp, wage_count,
            unemp_count, wbhaom, female, region, age, hoursuint, citistat):
        """Create a new InputRecord instance.

        Args:
            index (int): Unique integer identifying this input record.
            educ (str): Education level label as string.
            docc03 (str): Occupation classification as string.
            wageotc (List[WageTuple]): Equivalent hourly wage in USD with
                weights as list of WageTuple.
            unemp (float): Percent unemployment (0-100) as float.
            wage_count (float): Sum of weights for wage information as float.
            unemp_count (float): Sum of weights for unemployment information as
                float.
            wbhaom (string): Race and ethnicity label as string.
            female (bool): True if Female and False otherwise.
            region (string): Geographic region label as string.
            age (string): Age group label as string.
            hoursuint (string): Hours worked category as string.
            citistat (string): Citizenship status as string.
        """
        self._index = index
        self._educ = educ
        self._docc03 = docc03
        self._wageotc = wageotc
        self._unemp = unemp
        self._wage_count = wage_count
        self._unemp_count = unemp_count
        self._wbhaom = wbhaom
        self._female = female
        self._region = region
        self._age = age
        self._hoursuint = hoursuint
        self._citistat = citistat

    def get_index(self):
        """Get a unique integer identifying this input record.

        Returns:
            int: Integer ID that is unique across all InputRecords.
        """
        return self._index

    def get_educ(self):
        """Get education level.

        Returns:
            str: Education level label (less than high school, high school, 
                some college, college, or advanced).
        """
        return self._educ

    def get_docc03(self):
        """Get occupation classification.

        Returns:
            str: Occupation as defined by the US Census.
        """
        return self._docc03

    def get_wageotc(self):
        """Get wage information.

        Returns:
            List of WageTuple: Hourly wage in USD including tips, commission,
                and overtime, with population weights.
        """
        return self._wageotc

    def get_unemp(self):
        """Get unemployment percentage.

        Returns:
            float: Percent unemployment within this group as a number from 0 to
                100.
        """
        return self._unemp

    def get_wage_count(self):
        """Get wage population weight.

        Returns:
            float: Sum of weights for this group related to wage information.
        """
        return self._wage_count

    def get_unemp_count(self):
        """Get unemployment population weight.

        Returns:
            float: Sum of weights for this group related to unemployment
                information.
        """
        return self._unemp_count

    def get_wbhaom(self):
        """Get race and ethnicity information.

        Returns:
            str: Race and ethnicity label (White, Black, Hispanic, Asian, 
                Native American, or Multiple races).
        """
        return self._wbhaom

    def get_female(self):
        """Get gender information.

        Returns:
            bool: True if Female and False otherwise.
        """
        return self._female

    def get_region(self):
        """Get geographic region.

        Returns:
            str: Census region (northeast, midwest, south, or west).
        """
        return self._region

    def get_age(self):
        """Get age group.

        Returns:
            str: Age group label (e.g., "45-55 yr", "<25 yr", "65+").
        """
        return self._age

    def get_hoursuint(self):
        """Get hours worked category.

        Returns:
            str: Description of hours worked (at least 35 hours, less than 35
                hours, or varies or other).
        """
        return self._hoursuint

    def get_citistat(self):
        """Get citizenship status.

        Returns:
            str: Citizenship status as defined by the US Census.
        """
        return self._citistat


class Dataset:

    def __init__(self, input_records):
        self._records_by_id = dict(map(
            lambda x: (x.get_index(), x),
            input_records
        ))
        self._id_by_educ = self._make_index(
            lambda x: x.get_educ(),
            input_records
        )

    def _make_index(self, getter, records):
        def combine_records(a, b):
            keys = set(a.keys()).union(b.keys())
            return dict(map(
                lambda key: (key, a.get(key, set()).union(b.get(key, set()))),
                keys
            ))

        individual = map(
            lambda x: {getter(x): {x.get_index()}},
            records
        )
        return functools.reduce(combine_records, individual)
