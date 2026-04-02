import * as assert from "assert";
import {
  hexToRgb,
  getForegroundColor,
  getInactiveBackground,
  getNextColor,
  getRelativeLuminance,
} from "../../../color/palette";

suite("Color Palette Utilities", () => {
  test("hexToRgb parses hex colors", () => {
    assert.deepStrictEqual(hexToRgb("#ff0000"), { r: 255, g: 0, b: 0 });
    assert.deepStrictEqual(hexToRgb("#00ff00"), { r: 0, g: 255, b: 0 });
    assert.deepStrictEqual(hexToRgb("#0000ff"), { r: 0, g: 0, b: 255 });
    assert.deepStrictEqual(hexToRgb("#ffffff"), { r: 255, g: 255, b: 255 });
    assert.deepStrictEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0 });
  });

  test("getForegroundColor returns white for dark backgrounds", () => {
    assert.strictEqual(getForegroundColor("#000000"), "#ffffff");
    assert.strictEqual(getForegroundColor("#1f6feb"), "#ffffff");
    assert.strictEqual(getForegroundColor("#2ea043"), "#ffffff");
  });

  test("getForegroundColor returns black for light backgrounds", () => {
    assert.strictEqual(getForegroundColor("#ffffff"), "#000000");
    assert.strictEqual(getForegroundColor("#e3b341"), "#000000");
  });

  test("getInactiveBackground appends 99 opacity", () => {
    assert.strictEqual(getInactiveBackground("#1f6feb"), "#1f6feb99");
    assert.strictEqual(getInactiveBackground("#2ea043"), "#2ea04399");
  });

  test("getNextColor picks first unused color", () => {
    const palette = ["#aaa", "#bbb", "#ccc"];
    assert.strictEqual(getNextColor(palette, []), "#aaa");
    assert.strictEqual(getNextColor(palette, ["#aaa"]), "#bbb");
    assert.strictEqual(getNextColor(palette, ["#aaa", "#bbb"]), "#ccc");
  });

  test("getNextColor cycles when all used", () => {
    const palette = ["#aaa", "#bbb"];
    const result = getNextColor(palette, ["#aaa", "#bbb"]);
    assert.strictEqual(result, "#aaa"); // cycles back
  });

  test("getRelativeLuminance is correct for extremes", () => {
    assert.ok(getRelativeLuminance("#ffffff") > 0.9);
    assert.ok(getRelativeLuminance("#000000") < 0.1);
  });
});
