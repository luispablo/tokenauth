
const objectEquals = require("../lib/objectEquals");
const test = require("ava");

test("same object", function (t) {
  const obj = { name: "Tom" };
  t.truthy(objectEquals(obj, obj));
});

test("equal objects", function (t) {
  const obj1 = { name: "Tom", son: { name: "arthur" } };
  const obj2 = { ...obj1 };
  t.truthy(objectEquals(obj1, obj2));
});

test("distinct objects", function (t) {
  const obj1 = { name: "Tom" };
  const obj2 = { ...obj1, age: 30 };
  t.falsy(objectEquals(obj1, obj2));
});

test("null & undefined values", function (t) {
  const obj1 = { name: "Tom", son: null, daughter: undefined };
  const obj2 = { ...obj1 };
  t.truthy(objectEquals(obj1, obj2));
  t.false(objectEquals(obj1, null));
  t.false(objectEquals(obj2, undefined));
});

test("compare strings", function (t) {
  t.truthy(objectEquals("Tom", "Tom"));
});

test("compare arrays", function (t) {
  t.truthy(objectEquals([], []));
  t.truthy(objectEquals(["a"], ["a"]));
  t.false(objectEquals(["a"], ["b"]));
  t.truthy(objectEquals([{ name: "a" }], [{ name: "a" }]));
});
