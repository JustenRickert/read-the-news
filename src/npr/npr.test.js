const {
  __impl: { parseTimestamp }
} = require("./npr");

describe("utils", () => {
  it("has working timestamp parsing", () => {
    const date = "October 30, 2019";
    const times = ["12:00 AM ET", "12:00 PM ET", "5:05 AM ET", "5:05 PM ET"];
    const expected = [
      "30 October 2019 00:00:00 EST",
      "30 October 2019 12:00:00 EST",
      "30 October 2019 05:05:00 EST",
      "30 October 2019 17:05:00 EST"
    ];
    expect(times.map(time => parseTimestamp(date, time))).toEqual(expected);
  });
});
