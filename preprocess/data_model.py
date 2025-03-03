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


class Query:
    """Class to represent a query against a dataset.

    This class provides a way to filter a dataset by specifying values for
    different dimensions. When a dimension is set to None, no filtering is
    applied for that dimension.
    """

    def __init__(self):
        """Initialize a new Query with no filters applied.

        All filter dimensions are initially set to None, meaning no filtering
        will be applied unless explicitly set.
        """
        self._educ = None
        self._docc03 = None
        self._wbhaom = None
        self._female = None
        self._region = None
        self._age = None
        self._hoursuint = None
        self._citistat = None

    def get_educ(self):
        """Get the education level filter.

        Returns:
            str or None: The education level to filter for, or None if no
                filtering should be applied.
        """
        return self._educ

    def set_educ(self, value):
        """Set the education level filter.

        Args:
            value (str or None): The education level to filter for, or None to
                disable filtering by education.
        """
        self._educ = value

    def clear_educ(self):
        """Clear the filter for education level."""
        self._educ = None

    def clear_docc03(self):
        """Clear the filter for occupation."""
        self._docc03 = None
        
    def clear_wbhaom(self):
        """Clear the filter for race/ethnicity."""
        self._wbhaom = None
        
    def clear_female(self):
        """Clear the filter for gender."""
        self._female = None
        
    def clear_region(self):
        """Clear the filter for geographic region."""
        self._region = None
        
    def clear_age(self):
        """Clear the filter for age group."""
        self._age = None
        
    def clear_hoursuint(self):
        """Clear the filter for hours worked category."""
        self._hoursuint = None
        
    def clear_citistat(self):
        """Clear the filter for citizenship status."""
        self._citistat = None

    def get_docc03(self):
        """Get the occupation filter.

        Returns:
            str or None: The occupation to filter for, or None if no filtering
                should be applied.
        """
        return self._docc03

    def set_docc03(self, value):
        """Set the occupation filter.

        Args:
            value (str or None): The occupation to filter for, or None to disable
                filtering by occupation.
        """
        self._docc03 = value

    def get_wbhaom(self):
        """Get the race/ethnicity filter.

        Returns:
            str or None: The race/ethnicity to filter for, or None if no filtering
                should be applied.
        """
        return self._wbhaom

    def set_wbhaom(self, value):
        """Set the race/ethnicity filter.

        Args:
            value (str or None): The race/ethnicity to filter for, or None to
                disable filtering by race/ethnicity.
        """
        self._wbhaom = value

    def get_female(self):
        """Get the gender filter.

        Returns:
            bool or None: True to filter for Female, False to filter for Male,
                or None if no filtering should be applied.
        """
        return self._female

    def set_female(self, value):
        """Set the gender filter.

        Args:
            value (bool or None): True to filter for Female, False to filter for
                Male, or None to disable filtering by gender.
        """
        self._female = value

    def get_region(self):
        """Get the geographic region filter.

        Returns:
            str or None: The region to filter for, or None if no filtering should
                be applied.
        """
        return self._region

    def set_region(self, value):
        """Set the geographic region filter.

        Args:
            value (str or None): The region to filter for, or None to disable
                filtering by region.
        """
        self._region = value

    def get_age(self):
        """Get the age group filter.

        Returns:
            str or None: The age group to filter for, or None if no filtering
                should be applied.
        """
        return self._age

    def set_age(self, value):
        """Set the age group filter.

        Args:
            value (str or None): The age group to filter for, or None to disable
                filtering by age group.
        """
        self._age = value

    def get_hoursuint(self):
        """Get the hours worked filter.

        Returns:
            str or None: The hours worked category to filter for, or None if no
                filtering should be applied.
        """
        return self._hoursuint

    def set_hoursuint(self, value):
        """Set the hours worked filter.

        Args:
            value (str or None): The hours worked category to filter for, or None
                to disable filtering by hours worked.
        """
        self._hoursuint = value

    def get_citistat(self):
        """Get the citizenship status filter.

        Returns:
            str or None: The citizenship status to filter for, or None if no
                filtering should be applied.
        """
        return self._citistat

    def set_citistat(self, value):
        """Set the citizenship status filter.

        Args:
            value (str or None): The citizenship status to filter for, or None
                to disable filtering by citizenship status.
        """
        self._citistat = value


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
        self._id_by_docc03 = self._make_index(
            lambda x: x.get_docc03(),
            input_records
        )
        self._id_by_wbhaom = self._make_index(
            lambda x: x.get_wbhaom(),
            input_records
        )
        self._id_by_female = self._make_index(
            lambda x: x.get_female(),
            input_records
        )
        self._id_by_region = self._make_index(
            lambda x: x.get_region(),
            input_records
        )
        self._id_by_age = self._make_index(
            lambda x: x.get_age(),
            input_records
        )
        self._id_by_hoursuint = self._make_index(
            lambda x: x.get_hoursuint(),
            input_records
        )
        self._id_by_citistat = self._make_index(
            lambda x: x.get_citistat(),
            input_records
        )

    def get_wageotc(self, query):
        """Get median wage for a group with overtime, tips, and comissions.

        Args:
            query (Query): A Query object describing the population for which
                the median wage should be returned.

        Returns:
            float: The estimated median wage for the given population.
        """
        pass

    def get_unemp(self, query):
        """Get the overall unemployment rate for a group.

        Args:
            query (Query): A Query object describing the population for which
                the unemployemnt rate should be returned.

        Returns:
            float: The estimated unemployment rate for the specified group.
        """
        pass

    def get_size_count(self, query):
        """Get the size of a population as summed census weight.

        Args:
            query (Query): A Query object describing the population for which
                the size should be returned.

        Returns:
            float: Estimated size of this population as a weight. This is
                propotional to the size of the population represented. Note
                that this uses the wage count though the wage and unemployemnt
                count are often the same.
        """
        pass

    def _get_subpopulation(self, query):

        def filter_value(accumulator_index, filter_index, filter_value):
            if filter_value is None:
                return accumulator_index

            allowed = filter_index[filter_value]
            return allowed.intersection(accumulator_index)

        ret_index = set(self._records_by_id.keys())
        ret_index = filter_value(ret_index, self._id_by_educ, query.get_educ())

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
