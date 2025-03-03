"""Tools to perform calculations on preprocessed EPI data.

Author: A Samuel Pottinger
License: MIT License
"""
import csv


class InputRecord:

    def __init__(self, educ, docc03, wageotc, unemp, wage_count, unemp_count, wbhaom,
            female, region, age, hoursuint, citistat)
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
        return self._educ

    def get_docc03(self):
        return self._docc03

    def get_wageotc(self):
        return self._wageotc

    def get_unemp(self):
        return self._unemp

    def get_wage_count(self):
        return self._wage_count

    def get_unemp_count(self):
        return self._unemp_count

    def get_wbhaom(self):
        return self._wbhaom

    def get_female(self):
        return self._female

    def get_region(self):
        return self._region

    def get_age(self):
        return self._age

    def get_hoursuint(self):
        return self._hoursuint

    def get_citistat(self):
        return self._citistat
