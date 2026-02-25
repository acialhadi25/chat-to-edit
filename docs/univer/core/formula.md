# Univer Formula Documentation

## Overview

Univer Sheets provides comprehensive formula support with hundreds of built-in functions across multiple categories. This document covers formula usage, custom formulas, and the complete function reference.

## Formula Basics

### Formula Format

**CRITICAL**: All formulas in Univer must start with `=`

```typescript
// Correct formula format
const cell = {
  f: '=SUM(A1:A10)',  // Formula with leading =
  v: ''                // Value (empty, let Univer calculate)
}

// Cell without formula
const cell = {
  v: 'Hello World'     // Just value
}
```

### Setting Formulas via API

```typescript
const fWorksheet = univerAPI.getActiveWorkbook().getActiveSheet()

// Set formula in cell A3
const cellA3 = fWorksheet.getRange('A3')
cellA3.setValue({ f: '=CUSTOMSUM(A1,A2)' })

// Or use string (will be interpreted as formula if starts with =)
cellA3.setValue('=A1+A2')
```

### Getting Formulas

```typescript
const fRange = fWorksheet.getRange('A1:B2')

// Get formula of top-left cell
console.log(fRange.getFormula())

// Get all formulas in range
console.log(fRange.getFormulas())
```

## Custom Formulas

### Register Custom Formula

```typescript
const formulaEngine = univerAPI.getFormula()

formulaEngine.registerFunction(
  'CUSTOMSUM',
  (...variants) => {
    let sum = 0
    for (const variant of variants) {
      sum += Number(variant) || 0
    }
    return sum
  },
  'Adds its arguments',
)
```

### Using Custom Formula

```typescript
const cellA3 = fWorksheet.getRange('A3')
cellA3.setValue({ f: '=CUSTOMSUM(A1,A2)' })
```

### Unregister Formula

```typescript
const functionDisposable = formulaEngine.registerFunction({
  // calculate
})

// Unregister
functionDisposable.dispose()
```

### Formula with Localization

```typescript
formulaEngine.registerFunction(
  'CUSTOMSUM',
  (...variants) => {
    let sum = 0
    for (const variant of variants) {
      sum += Number(variant) || 0
    }
    return sum
  },
  {
    description: {
      functionName: 'CUSTOMSUM',
      description: 'formulaCustom.CUSTOMSUM.description',
      abstract: 'formulaCustom.CUSTOMSUM.abstract',
      functionParameter: [
        {
          name: 'formulaCustom.CUSTOMSUM.functionParameter.number1.name',
          detail: 'formulaCustom.CUSTOMSUM.functionParameter.number1.detail',
          example: 'A1:A20',
          require: 1,
          repeat: 0,
        },
      ],
    },
    locales: {
      zhCN: {
        formulaCustom: {
          CUSTOMSUM: {
            description: '将单个值、单元格引用或是区域相加',
            abstract: '求参数的和',
            functionParameter: {
              number1: {
                name: '数值1',
                detail: '要相加的第一个数字',
              },
            },
          },
        },
      },
      enUS: {
        formulaCustom: {
          CUSTOMSUM: {
            description: 'Adds its arguments',
            abstract: 'Adds its arguments',
            functionParameter: {
              number1: {
                name: 'number1',
                detail: 'The first number you want to add',
              },
            },
          },
        },
      },
    },
  },
)
```

## Built-in Formula Categories

Univer supports hundreds of built-in formulas across the following categories:

### Financial Functions
- ACCRINT, ACCRINTM, AMORDEGRC, AMORLINC
- COUPDAYBS, COUPDAYS, COUPDAYSNC, COUPNCD, COUPNUM, COUPPCD
- CUMIPMT, CUMPRINC, DB, DDB, DISC
- DOLLARDE, DOLLARFR, DURATION, EFFECT
- FV, FVSCHEDULE, INTRATE, IPMT, IRR, ISPMT
- MDURATION, MIRR, NOMINAL, NPER, NPV
- And many more...

### Date & Time Functions
- DATE, DATEDIF, DATEVALUE, DAY, DAYS, DAYS360
- EDATE, EOMONTH, EPOCHTODATE, HOUR
- ISOWEEKNUM, MINUTE, MONTH
- NETWORKDAYS, NETWORKDAYS_INTL, NOW
- SECOND, TIME, TIMEVALUE, TO_DATE, TODAY
- WEEKDAY, WEEKNUM, WORKDAY, WORKDAY_INTL
- YEAR, YEARFRAC

### Math & Trigonometry Functions
- ABS, ACOS, ACOSH, ACOT, ACOTH
- AGGREGATE, ARABIC, ASIN, ASINH, ATAN, ATAN2, ATANH
- BASE, CEILING, CEILING_MATH, CEILING_PRECISE
- COMBIN, COMBINA, COS, COSH, COT, COTH
- CSC, CSCH, DECIMAL, DEGREES
- EVEN, EXP, FACT, FACTDOUBLE
- FLOOR, FLOOR_MATH, FLOOR_PRECISE
- GCD, INT, ISO_CEILING, LCM, LET
- LN, LOG, LOG10, MDETERM, MINVERSE, MMULT
- MOD, MROUND, MULTINOMIAL, MUNIT
- ODD, PI, POWER, PRODUCT, QUOTIENT
- RADIANS, RAND, RANDARRAY, RANDBETWEEN
- ROMAN, ROUND, ROUNDBANK, ROUNDDOWN, ROUNDUP
- SEC, SECH, SERIESSUM, SEQUENCE
- SIGN, SIN, SINH, SQRT, SQRTPI
- SUBTOTAL, SUM, SUMIF, SUMIFS
- SUMPRODUCT, SUMSQ, SUMX2MY2, SUMX2PY2, SUMXMY2
- TAN, TANH, TRUNC

### Statistical Functions
- AVEDEV, AVERAGE, AVERAGE_WEIGHTED, AVERAGEA, AVERAGEIF, AVERAGEIFS
- BETA_DIST, BETA_INV, BINOM_DIST, BINOM_DIST_RANGE, BINOM_INV
- CHISQ_DIST, CHISQ_DIST_RT, CHISQ_INV, CHISQ_INV_RT, CHISQ_TEST
- CONFIDENCE_NORM, CONFIDENCE_T, CORREL
- COUNT, COUNTA, COUNTBLANK, COUNTIF, COUNTIFS
- COVARIANCE_P, COVARIANCE_S, DEVSQ
- EXPON_DIST, F_DIST, F_DIST_RT, F_INV, F_INV_RT, F_TEST
- FISHER, FISHERINV, FORECAST, FORECAST_ETS
- FREQUENCY, GAMMA, GAMMA_DIST, GAMMA_INV
- GAMMALN, GAMMALN_PRECISE, GAUSS, GEOMEAN
- GROWTH, HARMEAN, HYPGEOM_DIST
- INTERCEPT, KURT, LARGE, LINEST, LOGEST
- LOGNORM_DIST, LOGNORM_INV, MARGINOFERROR
- MAX, MAXA, MAXIFS, MEDIAN, MIN, MINA, MINIFS
- MODE_MULT, MODE_SNGL, NEGBINOM_DIST
- NORM_DIST, NORM_INV, NORM_S_DIST, NORM_S_INV
- PEARSON, PERCENTILE_EXC, PERCENTILE_INC
- PERCENTRANK_EXC, PERCENTRANK_INC
- PERMUT, PERMUTATIONA, PHI, POISSON_DIST
- PROB, QUARTILE_EXC, QUARTILE_INC
- RANK_AVG, RANK_EQ, RSQ
- SKEW, SKEW_P, SLOPE, SMALL, STANDARDIZE
- STDEV_P, STDEV_S, STDEVA, STDEVPA
- STEYX, T_DIST, T_DIST_2T, T_DIST_RT
- T_INV, T_INV_2T, T_TEST
- TREND, TRIMMEAN, VAR_P, VAR_S, VARA, VARPA
- WEIBULL_DIST, Z_TEST

### Lookup & Reference Functions
- ADDRESS, AREAS, CHOOSE, CHOOSECOLS, CHOOSEROWS
- COLUMN, COLUMNS, DROP, EXPAND, FILTER
- FORMULATEXT, GETPIVOTDATA, HLOOKUP
- HSTACK, HYPERLINK, IMAGE, INDEX, INDIRECT
- LOOKUP, MATCH, OFFSET, ROW, ROWS
- RTD, SORT, SORTBY, TAKE
- TOCOL, TOROW, TRANSPOSE, UNIQUE
- VLOOKUP, VSTACK, WRAPCOLS, WRAPROWS
- XLOOKUP, XMATCH

### Database Functions
- DAVERAGE, DCOUNT, DCOUNTA, DGET
- DMAX, DMIN, DPRODUCT
- DSTDEV, DSTDEVP, DSUM, DVAR, DVARP

### Text Functions
- ASC, ARRAYTOTEXT, BAHTTEXT, CHAR, CLEAN, CODE
- CONCAT, CONCATENATE, DBCS, DOLLAR
- EXACT, FIND, FINDB, FIXED
- LEFT, LEFTB, LEN, LENB, LOWER
- MID, MIDB, NUMBERSTRING, NUMBERVALUE
- PHONETIC, PROPER, REGEXEXTRACT, REGEXMATCH, REGEXREPLACE
- REPLACE, REPLACEB, REPT, RIGHT, RIGHTB
- SEARCH, SEARCHB, SUBSTITUTE, T, TEXT
- TEXTAFTER, TEXTBEFORE, TEXTJOIN, TEXTSPLIT
- TRIM, UNICHAR, UNICODE, UPPER, VALUE, VALUETOTEXT

### Logical Functions
- AND, BYCOL, BYROW, FALSE
- IF, IFERROR, IFNA, IFS
- LAMBDA, MAKEARRAY, MAP, NOT, OR
- REDUCE, SCAN, SWITCH, TRUE, XOR

### Information Functions
- CELL, ERROR_TYPE, INFO
- ISBETWEEN, ISBLANK, ISDATE, ISEMAIL
- ISERR, ISERROR, ISEVEN, ISFORMULA
- ISLOGICAL, ISNA, ISNONTEXT, ISNUMBER
- ISODD, ISOMITTED, ISREF, ISTEXT, ISURL
- N, NA, SHEET, SHEETS, TYPE

### Engineering Functions
- BESSELI, BESSELJ, BESSELK, BESSELY
- BIN2DEC, BIN2HEX, BIN2OCT
- BITAND, BITLSHIFT, BITOR, BITRSHIFT, BITXOR
- COMPLEX, CONVERT
- DEC2BIN, DEC2HEX, DEC2OCT, DELTA
- ERF, ERF_PRECISE, ERFC, ERFC_PRECISE
- GESTEP, HEX2BIN, HEX2DEC, HEX2OCT
- IMABS, IMAGINARY, IMARGUMENT, IMCONJUGATE
- IMCOS, IMCOSH, IMCOT, IMCOTH
- IMCSC, IMCSCH, IMDIV, IMEXP
- IMLN, IMLOG, IMLOG10, IMLOG2
- IMPOWER, IMPRODUCT, IMREAL
- IMSEC, IMSECH, IMSIN, IMSINH
- IMSQRT, IMSUB, IMSUM, IMTAN, IMTANH
- OCT2BIN, OCT2DEC, OCT2HEX

### Cube Functions
- CUBEKPIMEMBER, CUBEMEMBER, CUBEMEMBERPROPERTY
- CUBERANKEDMEMBER, CUBESET, CUBESETCOUNT, CUBEVALUE

### Compatibility Functions
- BETADIST, BETAINV, BINOMDIST, CHIDIST, CHIINV, CHITEST
- CONFIDENCE, COVAR, CRITBINOM
- EXPONDIST, FDIST, FINV, FTEST
- GAMMADIST, GAMMAINV, HYPGEOMDIST
- LOGINV, LOGNORMDIST, MODE
- NEGBINOMDIST, NORMDIST, NORMINV
- NORMSDIST, NORMSINV, PERCENTILE, PERCENTRANK
- POISSON, QUARTILE, RANK
- STDEV, STDEVP, TDIST, TINV, TTEST
- VAR, VARP, WEIBULL, ZTEST

### Web Functions
- ENCODEURL, FILTERXML, WEBSERVICE

### Array Functions
- ARRAY_CONSTRAIN, FLATTEN

## Best Practices

1. **Always use leading `=`** in formula strings
2. **Set cell value to empty** when using formulas - let Univer calculate
3. **Use custom formulas** for reusable business logic
4. **Localize formulas** for international applications
5. **Dispose formula listeners** when no longer needed

## Common Formula Examples

```typescript
// Basic arithmetic
cellA1.setValue({ f: '=A2+B2' })

// SUM function
cellA1.setValue({ f: '=SUM(A1:A10)' })

// IF condition
cellA1.setValue({ f: '=IF(A1>10,"High","Low")' })

// VLOOKUP
cellA1.setValue({ f: '=VLOOKUP(A2,B:C,2,FALSE)' })

// Nested functions
cellA1.setValue({ f: '=SUM(IF(A1:A10>5,A1:A10,0))' })

// Date functions
cellA1.setValue({ f: '=TODAY()' })
cellA2.setValue({ f: '=DATEDIF(A1,B1,"D")' })

// Text functions
cellA1.setValue({ f: '=CONCATENATE(A2," ",B2)' })
cellA2.setValue({ f: '=UPPER(A1)' })
```

## References

- [Univer Official Formula Docs](https://docs.univer.ai/guides/sheets/features/core/formula)
- [General API Documentation](./general-api.md)

---

**Last Updated**: 2025-02-25
**Source**: https://docs.univer.ai/guides/sheets/features/core/formula
**Content rephrased for compliance with licensing restrictions**
