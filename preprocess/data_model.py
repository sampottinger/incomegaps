"""Tools to perform calculations on preprocessed EPI data.

Author: A Samuel Pottinger
License: MIT License
"""
import csv


class InputRecord:
    """A representation of an income dataset record.
    
    This class represents a single record from the income dataset, containing information
    about education, occupation, wage, unemployment, demographics, and more.
    
    Attributes:
        _educ: Education level converted to labels. Takes values: less than high school,
            high school, some college, college, and advanced.
        _docc03: Occupation like "computer and mathematical science occupations" as
            defined by the US Census.
        _wageotc: Equivalent hourly wage in USD including tips, commission, and overtime.
            Contains tuples separated by semicolons, with each tuple containing a value
            in USD and a weight proportional to population size.
        _unemp: The percent unemployment within this group as a number from 0 to 100.
        _wage_count: The sum of weights for this group which is comparable to other groups.
            Proportional to the size of the population represented in this group for wages.
        _unemp_count: The sum of weights for this group which is comparable to other groups.
            Proportional to the size of the population represented for unemployment rates.
        _wbhaom: Race and ethnicity label as provided by the Census. Takes values: White,
            Black, Hispanic, Asian, Native American, and Multiple races.
        _female: Gender of group as defined by Census. Female if yes and Male otherwise.
        _region: Location of group using Census region definition as converted to labels.
            Takes values: northeast, midwest, south, and west.
        _age: Age groups typically in increments of years of ten like "45-55 yr" but 
            bounded by "<25 yr" and "65+" on other side.
        _hoursuint: Description of number of hours worked. Takes values: at least 35 hours,
            less than 35 hours, and varies or other.
        _citistat: Citizenship status as defined by the US Census for this group. Takes values:
            "foreign born, naturalized US citizen", "foreign born, not a US citizen", 
            "native, born abroad with American parent(s)", "native, born in Puerto Rico or 
            other US island areas", and "native, born in US".
    """

    def __init__(self, educ, docc03, wageotc, unemp, wage_count, unemp_count, wbhaom,
            female, region, age, hoursuint, citistat):
        """Initialize an InputRecord instance.
        
        Args:
            educ: Education level label.
            docc03: Occupation classification.
            wageotc: Equivalent hourly wage in USD with weights.
            unemp: Percent unemployment (0-100).
            wage_count: Sum of weights for wage information.
            unemp_count: Sum of weights for unemployment information.
            wbhaom: Race and ethnicity label.
            female: Gender indicator (Female if yes, Male otherwise).
            region: Geographic region label.
            age: Age group label.
            hoursuint: Hours worked category.
            citistat: Citizenship status.
        """
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
            str: Hourly wage in USD including tips, commission, and overtime,
                with population weights.
        """
        return self._wageotc

    def get_unemp(self):
        """Get unemployment percentage.
        
        Returns:
            float: Percent unemployment within this group as a number from 0 to 100.
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
            float: Sum of weights for this group related to unemployment information.
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
            str: Gender indicator (Female if yes, Male otherwise).
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
            str: Description of hours worked (at least 35 hours, less than 35 hours,
                or varies or other).
        """
        return self._hoursuint

    def get_citistat(self):
        """Get citizenship status.
        
        Returns:
            str: Citizenship status as defined by the US Census.
        """
        return self._citistat
