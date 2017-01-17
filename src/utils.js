export let isKind = (val, kind) => {
  return '[object '+ kind +']' === Object.prototype.toString.call(val)
}

export let isRegExp = (val) => {
  return isKind(val, 'RegExp')
}

export let isArray = (val) => {
  return isKind(val, 'Array')
}

export let isFunction = (val) => {
  return typeof val === 'function'
}

export let castArray = (val) => {
  return isArray(val) ? val : [val]
}