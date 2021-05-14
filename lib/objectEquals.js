
const objectEquals = function objectEquals (obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  } else if (typeof(obj1) === "string" || obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
    return false;
  } else if (Object.keys(obj1).length === Object.keys(obj2).length) {
    for (const key in obj1) if (!objectEquals(obj1[key], obj2[key])) return false;
    return true;
  } else {
    return false;
  }
};

module.exports = objectEquals;
