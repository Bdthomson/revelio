import { getDefaultValue } from './filter-utils'
import { getIn } from 'immutable'

export const deserialize = (filter: any, metacardTypes: any) => {
  if (typeof filter.property === 'object') {
    // if the filter is something like NEAR (which maps to a CQL filter function such as 'proximity'),
    // there is an enclosing filter that creates the necessary '= TRUE' predicate, and the 'property'
    // attribute is what actually contains that proximity() call.
    const { filterFunctionName, params } = filter.property
    if (filterFunctionName !== 'proximity') {
      throw new Error(
        'Unsupported filter function in filter view: ' + filterFunctionName
      )
    }
    const [property, distance, value] = params
    filter.property = property
    filter.type = 'NEAR'
    filter.value = { distance, value }
  }

  if (filter.type === 'BETWEEN') {
    filter.value = {
      lower: filter.lowerBoundary,
      upper: filter.upperBoundary,
    }
  }
  if (filter.type === 'IS NULL') {
    filter.value = getDefaultValue(
      getIn(metacardTypes, [filter.property, 'type'], 'STRING')
    )
  }
  return { ...filter }
}
const generateFilterFunction = (filterFunctionName: string, params: any) => {
  return {
    type: '=',
    value: true,
    property: {
      type: 'FILTER_FUNCTION',
      filterFunctionName,
      params,
    },
  }
}

const generateIsEmptyFilter = (property: string) => {
  return {
    type: 'IS NULL',
    property,
    value: null,
  }
}

export const serialize = (filter: any, metacardTypes: any) => {
  switch (filter.type) {
    case 'NEAR':
      return generateFilterFunction('proximity', [
        filter.property,
        filter.value.distance,
        filter.value.value,
      ])
    case 'IS NULL':
      return generateIsEmptyFilter(filter.property)
  }

  switch (getIn(metacardTypes, [filter.property, 'type'], undefined)) {
    case 'FLOAT':
    case 'DOUBLE':
      if (filter.type === 'BETWEEN') {
        return {
          ...filter,
          lowerBoundary: parseFloat(filter.value.lower),
          upperBoundary: parseFloat(filter.value.upper),
        }
      }
      return {
        ...filter,
        value: parseFloat(filter.value),
      }
    case 'INTEGER':
    case 'LONG':
    case 'SHORT':
      if (filter.type === 'BETWEEN') {
        return {
          ...filter,
          lowerBoundary: parseInt(filter.value.lower),
          upperBoundary: parseInt(filter.value.upper),
        }
      }
      return {
        ...filter,
        value: parseInt(filter.value),
      }
  }
  return { ...filter }
}
